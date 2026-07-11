import { NextRequest, NextResponse } from "next/server";
import { phCapture } from "@/lib/posthogServer";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

type StripeSubRaw = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

async function syncSubscription(sub: StripeSubRaw, supabaseUserId?: string) {
  const svc = supabaseService();
  const priceId = sub.items.data[0]?.price.id ?? null;
  const isActive = sub.status === "active" || sub.status === "trialing";
  const tier = isActive ? "premium" : "free";

  const patch: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    subscription_status: sub.status,
    tier,
    updated_at: new Date().toISOString(),
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    current_period_start: sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : null,
  };

  const userId = supabaseUserId ?? (sub.metadata?.supabase_user_id as string | undefined);

  if (userId) {
    await svc.schema("cosme_check").from("user_profiles").update(patch).eq("id", userId);
  } else {
    await svc.schema("cosme_check").from("user_profiles").update(patch).eq("stripe_customer_id", sub.customer as string);
  }
}

async function downgradeToFree(customerId: string) {
  const svc = supabaseService();
  await svc
    .schema("cosme_check")
    .from("user_profiles")
    .update({
      tier: "free",
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

async function grantCreditPack(userId: string, credits: number) {
  const svc = supabaseService();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await svc.schema("cosme_check").from("credit_grants").insert({
    user_id: userId,
    amount: credits,
    remaining: credits,
    grant_type: "credit_pack",
    note: `Pack ${credits} crédits acheté`,
    created_by: "stripe_webhook",
    expires_at: expiresAt,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const mode = session.mode;

        if (userId && customerId) {
          const svc = supabaseService();
          await svc
            .schema("cosme_check")
            .from("user_profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }

        // Analytics : abonnement demarre (essai inclus). Pack de credits exclu.
        if (mode === "subscription" && userId) {
          phCapture("premium_started", userId, { provider: "stripe" });
        }

        // Pack de crédits one-time : attribuer les crédits immédiatement
        if (mode === "payment" && userId) {
          const credits = parseInt(session.metadata?.credits ?? "0", 10);
          if (credits > 0) await grantCreditPack(userId, credits);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as StripeSubRaw;
        await syncSubscription(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as StripeSubRaw;
        await syncSubscription(sub); // status="canceled" → tier="free"
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription) as StripeSubRaw;
          await syncSubscription(sub); // remet tier=premium + met à jour current_period_start
        }
        break;
      }

      case "invoice.payment_failed": {
        // Coupure immédiate dès le premier échec, sans attendre les retries Stripe
        const invoice = event.data.object as Stripe.Invoice & { customer?: string };
        if (invoice.customer) {
          await downgradeToFree(invoice.customer as string);
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        // TODO: envoyer email de rappel J-3
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
