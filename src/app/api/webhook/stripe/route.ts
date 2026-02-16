import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (!userId) {
      return NextResponse.json({ received: true });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ received: true });
    }

    const subscription = await getStripe().subscriptions.retrieve(
      subscriptionId
    );

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const firstItem = subscription.items.data[0];
    const periodEnd = firstItem
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createServiceClient();

    if (session.metadata?.upgrade === "true" && session.metadata?.club_id) {
      await supabase.rpc("upgrade_club_subscription", {
        p_club_id: session.metadata.club_id,
        p_stripe_subscription_id: subscription.id,
        p_stripe_customer_id: customerId,
        p_current_period_end: periodEnd,
        p_user_id: userId,
      });
    } else {
      const clubName = session.metadata?.club_name;
      if (!clubName) {
        return NextResponse.json({ received: true });
      }

      const status = subscription.status === "trialing" ? "trialling" : "active";

      await supabase.rpc("create_club_with_stripe_subscription", {
        p_club_name: clubName,
        p_plan_type: "pro",
        p_status: status,
        p_stripe_subscription_id: subscription.id,
        p_stripe_customer_id: customerId,
        p_current_period_end: periodEnd,
        p_user_id: userId,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const supabase = createServiceClient();
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const sub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      typeof sub === "string" ? sub : sub?.id;

    if (subscriptionId) {
      const supabase = createServiceClient();
      await supabase
        .from("subscriptions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);
    }
  }

  return NextResponse.json({ received: true });
}
