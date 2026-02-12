import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const origin = request.nextUrl.origin;

  if (!sessionId) {
    return NextResponse.redirect(
      `${origin}/pricing?error=missing_session`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  let checkoutSession;
  try {
    checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return NextResponse.redirect(
      `${origin}/pricing?error=invalid_session`
    );
  }

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.redirect(
      `${origin}/pricing?error=payment_incomplete`
    );
  }

  const metadata = checkoutSession.metadata;
  if (metadata?.supabase_user_id !== user.id) {
    return NextResponse.redirect(
      `${origin}/pricing?error=user_mismatch`
    );
  }

  const subscription = checkoutSession.subscription as
    | import("stripe").Stripe.Subscription
    | null;

  if (!subscription) {
    return NextResponse.redirect(
      `${origin}/pricing?error=no_subscription`
    );
  }

  const firstItem = subscription.items.data[0];
  const periodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: rpcError } = await supabase.rpc(
    "create_club_with_stripe_subscription",
    {
      p_club_name: metadata.club_name ?? "My Club",
      p_plan_type: "pro",
      p_status: "active",
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      p_current_period_end: periodEnd,
    }
  );

  if (rpcError) {
    return NextResponse.redirect(
      `${origin}/pricing?error=club_creation_failed`
    );
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
