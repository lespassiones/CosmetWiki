import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Stripe from "stripe";
type StripeSubscriptionRaw = Stripe.Subscription & { current_period_end?: number };
type StripeInvoiceRaw = Stripe.Invoice & { subscription?: string };
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

async function syncSubscription(
  sub: StripeSubscriptionRaw,
  supabaseUserId?: string,
) {
  const svc = supabaseService();
  const priceId = sub.items.data[0]?.price.id ?? null;
  const isActive =
    sub.status === "active" || sub.status === "trialing";
  const tier = isActive ? "premium" : "free";

  const patch = {
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    subscription_status: sub.status,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    tier,
    updated_at: new Date().toISOString(),
  };

  // Prefer looking up by supabase_user_id from metadata
  const userId =
    supabaseUserId ??
    (sub.metadata?.supabase_user_id as string | undefined);

  if (userId) {
    await svc
      .schema("cosme_check")
      .from("user_profiles")
      .update(patch)
      .eq("id", userId);
    return;
  }

  // Fallback: look up by stripe_customer_id
  await svc
    .schema("cosme_check")
    .from("user_profiles")
    .update(patch)
    .eq("stripe_customer_id", sub.customer as string);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

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

        if (userId && customerId) {
          const svc = supabaseService();
          await svc
            .schema("cosme_check")
            .from("user_profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }

        // Subscription sync handled by subscription.created event
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as StripeSubscriptionRaw;
        await syncSubscription(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as StripeSubscriptionRaw;
        await syncSubscription(sub); // status = "canceled" → tier = "free"
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as StripeInvoiceRaw;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription) as StripeSubscriptionRaw;
          await syncSubscription(sub);
        }
        break;
      }

      case "invoice.payment_failed": {
        // Stripe retries automatically; we only downgrade after subscription.deleted
        break;
      }

      case "customer.subscription.trial_will_end": {
        // TODO: envoyer un email de rappel J-3
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
