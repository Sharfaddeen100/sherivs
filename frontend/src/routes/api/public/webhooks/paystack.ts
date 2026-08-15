/**
 * Paystack webhook receiver.
 *
 * Public site auth bypasses /api/public/*, so we verify the payload
 * signature ourselves. Paystack signs the raw request body with HMAC-SHA512
 * using the merchant secret key and sends `x-paystack-signature`.
 *
 * On `charge.success`, we mark the fee row paid by reference.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Payments not configured", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(raw).digest("hex");

        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        type PaystackEvent = {
          event: string;
          data: {
            reference?: string;
            amount?: number;
            status?: string;
            metadata?: { fee_id?: string; school_id?: string };
          };
        };
        let event: PaystackEvent | null = null;
        try {
          event = JSON.parse(raw) as PaystackEvent;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!event) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const schoolId = event.data?.metadata?.school_id ?? null;
        if (schoolId) {
          await supabaseAdmin.from("webhook_logs").insert({
            school_id: schoolId,
            provider: "paystack",
            event_type: event.event,
            payload: JSON.parse(JSON.stringify(event)),
            processing_status: "received",
          });
        }

        if (event.event === "charge.success" && event.data?.reference) {
          const feeId = event.data.metadata?.fee_id;
          const amount = event.data.amount ? event.data.amount / 100 : null;
          const upd = {
            status: "paid",
            paid_at: new Date().toISOString(),
            ...(amount != null ? { paid_amount: amount } : {}),
          };
          const query = supabaseAdmin
            .from("fees")
            .update(upd)
            .eq("paystack_reference", event.data.reference);
          if (feeId) await query.eq("id", feeId);
          else await query;
        }
        return new Response("ok");
      },
      // Paystack does not preflight, but be polite to debuggers.
      GET: async () => new Response("Paystack webhook endpoint", { status: 200 }),
    },
  },
});
