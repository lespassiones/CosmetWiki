import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est premium
  const { data: profile } = await sb
    .schema("cosme_check")
    .from("user_profiles")
    .select("tier, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.tier !== "premium") {
    return NextResponse.json({ error: "Réservé aux membres Premium" }, { status: 403 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: profile.stripe_customer_id ?? undefined,
    client_reference_id: user.id,
    mode: "payment",
    line_items: [{ price: STRIPE_PRICES.creditPack, quantity: 1 }],
    metadata: { credits: "50", type: "credit_pack", supabase_user_id: user.id },
    success_url: `${siteUrl}/?checkout=credits_success`,
    cancel_url: `${siteUrl}/offre`,
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
