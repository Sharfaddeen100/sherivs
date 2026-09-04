/**
 * Digital Twin server functions.
 *
 * Admin-only RPCs to manage a school's AI voice twin config and to
 * place / log outbound calls via Twilio. When the Twilio connector is
 * not linked, `placeTwinCall` records a "stub" call row so the UI flow
 * can be exercised end-to-end and returns a clear message; no fake
 * Twilio response is fabricated.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadMe(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, school_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Profile not found");
  return data as { id: string; role: string; school_id: string };
}

function requireAdmin(role: string) {
  if (!["admin", "principal"].includes(role)) throw new Error("Admin only");
}

// ---------------- Save config ----------------

const ConfigInput = z.object({
  twin_name: z.string().trim().min(1).max(80),
  twin_voice: z.string().trim().min(1).max(40),
  twin_personality: z.string().trim().min(1).max(2000),
  school_knowledge: z.any().optional().default({}),
  trigger_rules: z.any().optional().default({}),
  is_active: z.boolean().default(true),
});

export const saveTwinConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => ConfigInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const me = await loadMe(supabase, userId);
    requireAdmin(me.role);

    const { data: existing } = await supabase
      .from("digital_twin_config")
      .select("id")
      .eq("school_id", me.school_id)
      .maybeSingle();

    const payload: any = { ...data, school_knowledge: data.school_knowledge ?? {}, trigger_rules: data.trigger_rules ?? {} };
    if (existing) {
      const { error } = await supabase
        .from("digital_twin_config")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, updated: true };
    }
    const { data: ins, error } = await supabase
      .from("digital_twin_config")
      .insert({ ...payload, school_id: me.school_id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id, updated: false };
  });

// ---------------- Place outbound call ----------------

const CallInput = z.object({
  call_type: z.enum(["attendance_alert", "fees_reminder", "announcement", "custom"]),
  trigger_event: z.string().trim().max(120).optional(),
  recipient_name: z.string().trim().min(1).max(160),
  recipient_phone: z.string().trim().min(6).max(32),
  recipient_role: z.enum(["parent", "teacher", "student", "other"]).default("parent"),
  student_id: z.string().uuid().nullable().optional(),
  script: z.string().trim().min(1).max(4000),
});

const GATEWAY_URL = process.env.TWILIO_GATEWAY_URL || "https://api.twilio.com/2010-04-01";

export const placeTwinCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => CallInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const me = await loadMe(supabase, userId);
    requireAdmin(me.role);

    const { data: cfg } = await supabase
      .from("digital_twin_config")
      .select("id, is_active")
      .eq("school_id", me.school_id)
      .maybeSingle();

    const gatewayKey = process.env.AI_API_KEY || process.env.TWILIO_API_KEY;
    const twilioKey = process.env.TWILIO_API_KEY;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    const baseRow = {
      school_id: me.school_id,
      twin_config_id: cfg?.id ?? null,
      call_type: data.call_type,
      trigger_event: data.trigger_event ?? null,
      recipient_name: data.recipient_name,
      recipient_phone: data.recipient_phone,
      recipient_role: data.recipient_role,
      student_id: data.student_id ?? null,
      call_summary: data.script.slice(0, 500),
    };

    if (!gatewayKey || !twilioKey || !twilioFrom) {
      const { data: row, error } = await supabase
        .from("digital_twin_calls")
        .insert({
          ...baseRow,
          call_status: "stub",
          call_outcome: "twilio_not_connected",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return {
        id: row.id,
        status: "stub" as const,
        message:
          "Twilio is not connected — call was logged as a stub. Connect Twilio and set TWILIO_FROM_NUMBER to place real calls.",
      };
    }

    const twiml = `<Response><Say voice="alice">${data.script
      .replace(/</g, "&lt;")
      .replace(/&/g, "&amp;")}</Say></Response>`;

    const resp = await fetch(`${GATEWAY_URL}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: data.recipient_phone,
        From: twilioFrom,
        Twiml: twiml,
      }),
    });
    const body: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const { data: row } = await supabase
        .from("digital_twin_calls")
        .insert({
          ...baseRow,
          call_status: "failed",
          call_outcome: body?.message ?? `twilio_${resp.status}`,
        })
        .select("id")
        .single();
      throw new Error(`Twilio error [${resp.status}]: ${body?.message ?? "unknown"} (call id ${row?.id ?? "—"})`);
    }

    const { data: row, error } = await supabase
      .from("digital_twin_calls")
      .insert({
        ...baseRow,
        call_status: "queued",
        twilio_call_sid: body?.sid ?? null,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, status: "queued" as const, sid: body?.sid ?? null };
  });
