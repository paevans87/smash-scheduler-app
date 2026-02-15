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
  const { priceId, clubName } = body as {
    priceId: string;
    clubName: string;
  };

  if (!priceId || !clubName?.trim()) {
    return NextResponse.json(
      { error: "Missing priceId or clubName" },
      { status: 400 }
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
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customer.id,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        club_name: clubName.trim(),
      },
    },
    metadata: {
      supabase_user_id: user.id,
      club_name: clubName.trim(),
    },
    success_url: `${origin}/checkout/pending?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
