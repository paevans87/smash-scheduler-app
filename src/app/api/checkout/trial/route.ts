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

  const body = await request.json();
  const { clubName, priceId } = body as {
    clubName: string;
    priceId: string;
  };

  if (!clubName?.trim() || !priceId) {
    return NextResponse.json(
      { error: "Missing clubName or priceId" },
      { status: 400 }
    );
  }

  const { data: existingPro } = await supabase
    .from("subscriptions")
    .select("id, club_id!inner(id), club_organisers:club_id(user_id)")
    .eq("plan_type", "pro")
    .limit(1);

  const hasUsedTrial = existingPro?.some((sub) => {
    const organisers = sub.club_organisers as unknown as { user_id: string }[];
    return organisers?.some((org) => org.user_id === user.id);
  });

  if (hasUsedTrial) {
    return NextResponse.json(
      { error: "You have already used your free trial" },
      { status: 409 }
    );
  }

  const origin = request.nextUrl.origin;
  const stripe = getStripe();

  const customer = await stripe.customers.create({
    name: clubName.trim(),
    email: user.email,
    metadata: { supabase_user_id: user.id },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    payment_method_collection: "if_required",
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        supabase_user_id: user.id,
        club_name: clubName.trim(),
      },
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/checkout/pending?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    metadata: {
      supabase_user_id: user.id,
      club_name: clubName.trim(),
    },
  });

  return NextResponse.json({ url: session.url });
}
