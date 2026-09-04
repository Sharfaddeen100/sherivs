/**
 * Timetable: AI-assisted weekly schedule generation + persistence.
 * Generates a draft for a single class, then saves the timetable + slots
 * in one transaction-ish flow.
 */
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

const slotSchema = z.object({
  day_of_week: z.enum(DAYS),
  period_number: z.number().int().min(1).max(12),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().min(1).max(80),
  is_break: z.boolean().default(false),
  break_label: z.string().nullable().optional(),
});

const draftSchema = z.object({ slots: z.array(slotSchema).min(5).max(80) });

const generateInput = z.object({
  class_id: z.string().uuid(),
  subjects: z.array(z.string().min(1)).min(1).max(20),
  periods_per_day: z.number().int().min(4).max(10).default(7),
  start_hour: z.number().int().min(6).max(10).default(8),
  period_minutes: z.number().int().min(30).max(60).default(40),
  include_break: z.boolean().default(true),
});

export const generateTimetableDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => generateInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: me } = await supabase
      .from("users")
      .select("role, school_id")
      .eq("id", userId)
      .maybeSingle();
    if (!me || !["admin", "principal"].includes(me.role))
      throw new Error("Only admins or principals can generate timetables");

    const { data: klass } = await supabase
      .from("classes")
      .select("id, name, grade_level, school_id")
      .eq("id", data.class_id)
      .maybeSingle();
    if (!klass || klass.school_id !== me.school_id)
      throw new Error("Class not found in your school");

    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const { createAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createAiGatewayProvider(key);

    const prompt = `You are a school timetable planner. Build a 5-day weekly schedule (Mon–Fri) for class "${klass.name}" (${klass.grade_level ?? "general"}).
Constraints:
- ${data.periods_per_day} periods per school day, each ${data.period_minutes} minutes, starting at ${String(data.start_hour).padStart(2, "0")}:00.
- Subjects to distribute fairly across the week: ${data.subjects.join(", ")}.
- ${data.include_break ? "Insert a 20-minute break after period 3 each day (is_break=true, break_label='Break', subject='Break')." : "No break period."}
- No subject should appear more than 2 times in a single day.
- Spread heavy subjects (Maths, English, Sciences) earlier in the day when possible.
Return JSON with shape { "slots": [{day_of_week, period_number, start_time, end_time, subject, is_break, break_label}] }.
Times must be HH:MM 24h. day_of_week is lowercase (monday..friday).`;

    let draft: z.infer<typeof draftSchema>;
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: draftSchema }),
        prompt,
      });
      draft = output;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI generation failed";
      if (msg.includes("429")) throw new Error("AI rate limit reached. Try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Top up in workspace settings.");
      throw new Error(msg);
    }

    return { class_id: data.class_id, school_id: me.school_id, slots: draft.slots };
  });

const saveInput = z.object({
  class_id: z.string().uuid(),
  academic_year: z.string().min(4).max(20),
  term: z.string().min(1).max(20),
  publish: z.boolean().default(false),
  slots: z.array(slotSchema).min(1).max(120),
});

export const saveTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => saveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: me } = await supabase
      .from("users")
      .select("role, school_id")
      .eq("id", userId)
      .maybeSingle();
    if (!me || !["admin", "principal"].includes(me.role))
      throw new Error("Only admins or principals can save timetables");

    // Deactivate prior timetables for this class+year+term
    await supabase
      .from("timetables")
      .update({ is_active: false })
      .eq("school_id", me.school_id)
      .eq("class_id", data.class_id)
      .eq("academic_year", data.academic_year)
      .eq("term", data.term);

    const { data: tt, error: ttErr } = await supabase
      .from("timetables")
      .insert({
        school_id: me.school_id,
        class_id: data.class_id,
        academic_year: data.academic_year,
        term: data.term,
        generated_by: "ai",
        is_active: true,
        published: data.publish,
      })
      .select("id")
      .single();
    if (ttErr) throw new Error(ttErr.message);

    const rows = data.slots.map((s) => ({
      timetable_id: tt.id,
      school_id: me.school_id,
      day_of_week: s.day_of_week,
      period_number: s.period_number,
      start_time: s.start_time,
      end_time: s.end_time,
      subject: s.subject,
      is_break: s.is_break,
      break_label: s.break_label ?? null,
    }));

    const { error: slErr } = await supabase.from("timetable_slots").insert(rows);
    if (slErr) throw new Error(slErr.message);

    return { timetable_id: tt.id, slot_count: rows.length };
  });
