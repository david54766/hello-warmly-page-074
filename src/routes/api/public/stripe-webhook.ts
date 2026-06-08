import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook receiver — Phase 3B stub.
 *
 * This route records incoming events into `payment_webhook_events` for
 * admin inspection. Signature verification and event processing
 * (subscription/invoice/purchase mutations) will be wired up in a
 * later phase once STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are
 * configured via Lovable Cloud secrets.
 *
 * Production secrets MUST be managed via Lovable Cloud secrets, never
 * hard-coded. Required (later phase):
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 */
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text();
        const stripeSignature = request.headers.get("stripe-signature");

        // TODO (later phase): verify signature with STRIPE_WEBHOOK_SECRET.
        // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        // if (!webhookSecret || !stripeSignature) return new Response("Unauthorized", { status: 401 });
        // const event = stripe.webhooks.constructEvent(bodyText, stripeSignature, webhookSecret);

        let payload: Record<string, unknown> = {};
        let eventType = "unknown";
        let stripeEventId: string | null = null;
        try {
          payload = JSON.parse(bodyText) as Record<string, unknown>;
          eventType = (payload?.type as string) ?? "unknown";
          stripeEventId = (payload?.id as string) ?? null;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payment_webhook_events").insert({
            stripe_event_id: stripeEventId,
            event_type: eventType,
            payload_json: { ...payload, _signature: stripeSignature ?? null },
            processed: false,
            processing_error: stripeSignature
              ? "Signature verification pending — Stripe integration not yet activated."
              : "Missing stripe-signature header.",
          });
        } catch (err) {
          return new Response("Storage error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true, stub: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});