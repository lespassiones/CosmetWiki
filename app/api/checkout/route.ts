import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json() as { plan?: string };
  const plan = body.plan === "monthly" ? "monthly" : "yearly";
  const priceId = STRIPE_PRICES[plan];

  // Retrieve existing stripe_customer_id if any
  const { data: profile } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("stripe_customer_id, first_name")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id ?? undefined;

  // Create Stripe customer if not exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.first_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Persist immediately so concurrent requests don't create duplicates
    await sb
      .schema("cosme_check")
      .from("user_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { supabase_user_id: user.id, plan },
    },
    success_url: `${siteUrl}/?checkout=success`,
    cancel_url: `${siteUrl}/offre?checkout=cancelled`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
