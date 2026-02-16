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
  const { priceId, clubId } = body as {
    priceId: string;
    clubId: string;
  };

  if (!priceId || !clubId) {
    return NextResponse.json(
      { error: "Missing priceId or clubId" },
      { status: 400 }
    );
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("id", clubId)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a club organiser" }, { status: 403 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan_type, status")
    .eq("club_id", clubId)
    .eq("plan_type", "free")
    .eq("status", "active")
    .single();

  if (!subscription) {
    return NextResponse.json(
      { error: "No active free subscription to upgrade" },
      { status: 400 }
    );
  }

  const origin = request.nextUrl.origin;
  const stripe = getStripe();

  const customer = await stripe.customers.create({
    name: club.name,
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
        club_id: clubId,
        upgrade: "true",
      },
    },
    metadata: {
      supabase_user_id: user.id,
      club_id: clubId,
      upgrade: "true",
    },
    success_url: `${origin}/checkout/pending?session_id={CHECKOUT_SESSION_ID}&upgrade=${club.slug}`,
    cancel_url: `${origin}/upgrade?club=${club.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
