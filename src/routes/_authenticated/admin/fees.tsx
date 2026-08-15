import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { PortalPage } from "@/components/portal-shell";
import { CrudList } from "@/components/admin/crud-list";

export const Route = createFileRoute("/_authenticated/admin/fees")({
  ssr: false,
  component: AdminFeesPage,
});

const schema = z.object({
  student_id: z.string().uuid("Student ID must be a UUID"),
  fee_type: z.string().trim().min(1).max(80),
  amount: z.number().nonnegative().max(10_000_000),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable().optional(),
  term: z.string().trim().max(40).nullable().optional(),
  academic_year: z.string().trim().max(20).nullable().optional(),
  status: z.enum(["unpaid", "partial", "paid"]).default("unpaid"),
});

type Row = {
  id: string;
  fee_type: string;
  amount: number;
  paid_amount: number | null;
  status: string | null;
  due_date: string | null;
  term: string | null;
  academic_year: string | null;
  student_id: string;
};

function AdminFeesPage() {
  return (
    <PortalPage
      title="Fees & invoices"
      subtitle="Issue per-student fee invoices. Paid invoices update automatically when Paystack confirms payment."
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link to="/admin/dashboard" className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted/40">
          ← Dashboard
        </Link>
        <Link to="/admin/students" className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted/40">
          Students
        </Link>
        <Link to="/admin/settings" className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted/40">
          Payment settings
        </Link>
      </div>
      <CrudList<Row>
        config={{
          table: "fees",
          title: "Fee invoices",
          emptyHint: "No invoices yet. Issue the first one to start collecting fees.",
          schema,
          orderBy: { column: "created_at", ascending: false },
          defaultValues: { status: "unpaid" },
          columns: [
            { key: "fee_type", label: "Type" },
            {
              key: "amount",
              label: "Amount",
              render: (r) => `₦${Number(r.amount).toLocaleString()}`,
            },
            {
              key: "paid_amount",
              label: "Paid",
              render: (r) => `₦${Number(r.paid_amount ?? 0).toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <span
                  className={
                    r.status === "paid"
                      ? "text-emerald-400"
                      : r.status === "partial"
                        ? "text-amber-400"
                        : "text-rose-400"
                  }
                >
                  {r.status ?? "unpaid"}
                </span>
              ),
            },
            { key: "term", label: "Term" },
            { key: "academic_year", label: "Year" },
            { key: "due_date", label: "Due" },
            {
              key: "student_id",
              label: "Student",
              render: (r) => <code className="text-xs">{r.student_id.slice(0, 8)}…</code>,
            },
          ],
          fields: [
            { key: "student_id", label: "Student", type: "student", required: true, placeholder: "Search by name or admission no" },
            { key: "fee_type", label: "Fee type", type: "text", required: true, placeholder: "Tuition, Books, Uniform…" },
            { key: "amount", label: "Amount (₦)", type: "number", required: true },
            { key: "due_date", label: "Due date", type: "text", placeholder: "YYYY-MM-DD" },
            { key: "term", label: "Term", type: "text", placeholder: "1st / 2nd / 3rd" },
            { key: "academic_year", label: "Academic year", type: "text", placeholder: "2025/2026" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "unpaid", label: "Unpaid" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
              ],
            },
          ],
        }}
      />
    </PortalPage>
  );
}
