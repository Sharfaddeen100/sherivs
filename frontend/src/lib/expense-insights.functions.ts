/**
 * AI-powered expense insights.
 * Aggregates the last 90 days of school_expenses for the caller's school,
 * summarises spend by category, compares against monthly budgets, and asks
 * Gemini for plain-English insights + budget alerts. Never persists.
 */
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAiGatewayProvider } from "@/lib/ai-gateway.server";

const InsightSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  alerts: z.array(z.object({
    severity: z.enum(["info", "warn", "critical"]),
    category: z.string(),
    message: z.string(),
  })).max(8),
  recommendations: z.array(z.string()).max(6),
});

export type ExpenseInsights = z.infer<typeof InsightSchema>;

async function loadMe(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, school_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Profile not found");
  if (!["admin", "principal", "bursar"].includes(data.role)) throw new Error("Forbidden");
  return data as { id: string; role: string; school_id: string };
}

export const getExpenseInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExpenseInsights> => {
    const me = await loadMe(context.supabase, context.userId);
    const cutoff = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

    const [{ data: rows }, { data: budgets }] = await Promise.all([
      context.supabase
        .from("school_expenses")
        .select("amount, expense_category, expense_date")
        .eq("school_id", me.school_id)
        .gte("expense_date", cutoff),
      context.supabase
        .from("school_expense_budgets")
        .select("category, monthly_budget")
        .eq("school_id", me.school_id),
    ]);

    const byCat = new Map<string, number>();
    for (const r of rows ?? []) {
      byCat.set(r.expense_category, (byCat.get(r.expense_category) ?? 0) + Number(r.amount ?? 0));
    }
    const budgetMap = new Map<string, number>();
    for (const b of budgets ?? []) budgetMap.set(b.category, Number(b.monthly_budget ?? 0));

    const summary = Array.from(byCat.entries()).map(([cat, total]) => ({
      category: cat,
      total_90d: Math.round(total),
      monthly_avg: Math.round(total / 3),
      monthly_budget: budgetMap.get(cat) ?? null,
    }));

    if (summary.length === 0) {
      return {
        headline: "No expenses recorded yet",
        summary: "Start logging expenses to unlock AI-driven category insights and budget alerts.",
        alerts: [],
        recommendations: ["Add your first expense from the Add Expense form."],
      };
    }

    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI is not configured");
    const gateway = createAiGatewayProvider(key);
    const prompt = [
      "You are a school finance analyst. Currency: Nigerian Naira (₦).",
      "Given the following 90-day expense aggregates per category and monthly budgets,",
      "produce a short headline, a 2-3 sentence summary, alerts for any category whose",
      "monthly average exceeds 90% of its budget (critical at >100%, warn at >90%, info otherwise),",
      "and up to 6 cost-saving recommendations.",
      "",
      "DATA:",
      JSON.stringify(summary, null, 2),
    ].join("\n");

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: InsightSchema }),
        prompt,
      });
      return output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429/.test(msg)) throw new Error("AI is busy right now — try again in a moment.");
      if (/402/.test(msg)) throw new Error("AI credits exhausted for this workspace.");
      throw new Error(`AI insights failed: ${msg}`);
    }
  });
