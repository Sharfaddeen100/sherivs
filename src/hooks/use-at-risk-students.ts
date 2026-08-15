/**
 * Cross-portal at-risk student ranking.
 * Blends attendance (40%), academics (35%) and fee status (25%) into a single
 * 0-100 risk score where 100 = most at risk.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";

export type AtRiskStudent = {
  id: string;
  full_name: string;
  admission_number: string | null;
  class_id: string | null;
  attRate: number;
  gradeAvg: number;
  feeRate: number;
  riskScore: number;
};

export function useAtRiskStudents(limit = 200) {
  const { school, profile } = useApp();
  const schoolId = school?.id ?? profile?.school_id;

  return useQuery<AtRiskStudent[]>({
    queryKey: ["at-risk-students", schoolId, limit],
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, admission_number, class_id, users!students_user_id_fkey(full_name)")
        .eq("school_id", schoolId!)
        .eq("is_active", true)
        .limit(limit);
      if (studentsError) throw studentsError;
      if (!students?.length) return [];

      const termStart = new Date();
      termStart.setMonth(termStart.getMonth() - 3);

      const [attendance, grades, fees] = await Promise.all([
        supabase
          .from("attendance")
          .select("student_id, status")
          .eq("school_id", schoolId!)
          .gte("date", twoWeeksAgo.toISOString().split("T")[0]),
        supabase
          .from("grades")
          .select("student_id, total_score")
          .eq("school_id", schoolId!)
          .gte("created_at", termStart.toISOString()),
        supabase.from("fees").select("student_id, amount, paid_amount").eq("school_id", schoolId!),
      ]);

      const attRows = attendance.data ?? [];
      const gradeRows = grades.data ?? [];
      const feeRows = fees.data ?? [];

      return students
        .map((student) => {
          const stuAtt = attRows.filter((a) => a.student_id === student.id);
          const present = stuAtt.filter((a) => a.status === "present").length;
          const attRate = stuAtt.length > 0 ? (present / stuAtt.length) * 100 : 100;

          const stuGrades = gradeRows.filter(
            (g) => g.student_id === student.id && g.total_score != null,
          );
          const gradeAvg =
            stuGrades.length > 0
              ? stuGrades.reduce((s, g) => s + Number(g.total_score ?? 0), 0) / stuGrades.length
              : 100;

          const stuFees = feeRows.filter((f) => f.student_id === student.id);
          const billed = stuFees.reduce((s, f) => s + Number(f.amount ?? 0), 0);
          const paid = stuFees.reduce((s, f) => s + Number(f.paid_amount ?? 0), 0);
          const feeRate = billed > 0 ? Math.min(100, (paid / billed) * 100) : 100;

          const riskScore = Math.round(
            (100 - attRate) * 0.4 + (100 - gradeAvg) * 0.35 + (100 - feeRate) * 0.25,
          );

          const joined = student.users as { full_name?: string | null } | null;

          return {
            id: student.id,
            full_name: joined?.full_name ?? student.admission_number ?? "Unnamed student",
            admission_number: student.admission_number,
            class_id: student.class_id,
            attRate: Math.round(attRate),
            gradeAvg: Math.round(gradeAvg),
            feeRate: Math.round(feeRate),
            riskScore: Math.max(0, Math.min(100, riskScore)),
          };
        })
        .sort((a, b) => b.riskScore - a.riskScore);
    },
  });
}

export default useAtRiskStudents;
