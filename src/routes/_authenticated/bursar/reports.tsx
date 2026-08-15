import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";
import { PortalPage, SectionGrid, StatCard } from "@/components/portal-shell";

export const Route = createFileRoute("/_authenticated/bursar/reports")({
  ssr: false,
  component: BursarReports,
});

type FeeRow = {
  amount: number;
  paid_amount: number | null;
  status: string | null;
  fee_type: string;
  paid_at: string | null;
  created_at: string;
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];
const BAR_COLOR = "hsl(var(--primary))";

function BursarReports() {
  const { school } = useApp();
  const schoolId = school?.id;

  const fees = useQuery<FeeRow[]>({
    queryKey: ["bursar-reports", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fees")
        .select("amount, paid_amount, status, fee_type, paid_at, created_at")
        .eq("school_id", schoolId!)
        .limit(5000);
      if (error) throw new Error(error.message);
      return (data ?? []) as FeeRow[];
    },
  });

  const data = useMemo(() => {
    const rows = fees.data ?? [];
    const collected = rows.reduce((a, r) => a + Number(r.paid_amount ?? 0), 0);
    const outstanding = rows
      .filter((r) => r.status !== "paid")
      .reduce((a, r) => a + (Number(r.amount) - Number(r.paid_amount ?? 0)), 0);

    // monthly revenue (last 6 months)
    const months: { key: string; label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: d.toLocaleString(undefined, { month: "short" }),
        revenue: 0,
      });
    }
    rows.forEach((r) => {
      if (!r.paid_at) return;
      const d = new Date(r.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((x) => x.key === key);
      if (m) m.revenue += Number(r.paid_amount ?? 0);
    });

    // by fee type
    const typeMap = new Map<string, number>();
    rows
      .filter((r) => r.status === "paid")
      .forEach((r) => {
        typeMap.set(r.fee_type, (typeMap.get(r.fee_type) ?? 0) + Number(r.paid_amount ?? 0));
      });
    const byType = Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // status pie
    const status = [
      { name: "Paid", value: rows.filter((r) => r.status === "paid").length },
      { name: "Partial", value: rows.filter((r) => r.status === "partial").length },
      { name: "Unpaid", value: rows.filter((r) => r.status === "unpaid").length },
    ];

    return { collected, outstanding, total: rows.length, months, byType, status };
  }, [fees.data]);

  return (
    <PortalPage title="Financial reports" subtitle="Revenue, outstanding, and trends.">
      <SectionGrid>
        <StatCard label="Invoices" value={data.total} />
        <StatCard label="Collected (₦)" value={data.collected.toLocaleString()} />
        <StatCard label="Outstanding (₦)" value={data.outstanding.toLocaleString()} />
        <StatCard
          label="Collection rate"
          value={
            data.collected + data.outstanding === 0
              ? "—"
              : `${Math.round((data.collected / (data.collected + data.outstanding)) * 100)}%`
          }
        />
      </SectionGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="uos-card p-5">
          <h3 className="font-display font-semibold">Revenue — last 6 months</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(v: number) => `₦${v.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="revenue" stroke={BAR_COLOR} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="uos-card p-5">
          <h3 className="font-display font-semibold">Invoice status</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {data.status.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
            {data.status.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>

        <div className="uos-card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold">Collected by fee type</h3>
          {data.byType.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No paid invoices yet.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(v: number) => `₦${v.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </PortalPage>
  );
}
