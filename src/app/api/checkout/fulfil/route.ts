import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 }
    );
  }

  let checkoutSession;
  try {
    checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid checkout session" },
      { status: 400 }
    );
  }

  if (
    checkoutSession.payment_status !== "paid" &&
    checkoutSession.payment_status !== "no_payment_required"
  ) {
    return NextResponse.json(
      { error: "Payment incomplete" },
      { status: 402 }
    );
  }

  if (checkoutSession.metadata?.supabase_user_id !== user.id) {
    return NextResponse.json(
      { error: "User mismatch" },
      { status: 403 }
    );
  }

  const subscription = checkoutSession.subscription as
    | import("stripe").Stripe.Subscription
    | null;

  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 400 }
    );
  }

  const firstItem = subscription.items.data[0];
  const periodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const status = subscription.status === "trialing" ? "trialling" : "active";

  const { error: rpcError } = await supabase.rpc(
    "create_club_with_stripe_subscription",
    {
      p_club_name: checkoutSession.metadata?.club_name ?? "My Club",
      p_plan_type: "pro",
      p_status: status,
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      p_current_period_end: periodEnd,
      p_user_id: user.id,
    }
  );

  if (rpcError) {
    console.error("RPC Error:", rpcError);
    return NextResponse.json(
      { error: "Club creation failed", details: rpcError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
