/**
 * Study session persistence for the student AI tutor timer.
 * Every timer run is written to `study_sessions` (school-scoped) and the
 * history is read back for the student's study log.
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";

export type StudySession = {
  id: string;
  subject: string | null;
  duration_minutes: number | null;
  session_date: string | null;
  created_at: string | null;
};

function localDate(d = new Date()) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

/** Records completed timer runs into study_sessions. */
export function useStudySessionRecorder(studentId: string | null) {
  const { school, profile } = useApp();
  const schoolId = school?.id ?? (profile?.school_id as string | undefined);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { seconds: number; subject: string | null }) => {
      if (!schoolId || !studentId) throw new Error("Missing student context");
      const minutes = Math.round(input.seconds / 60);
      if (minutes < 1) return null;
      const { error } = await supabase.from("study_sessions").insert({
        school_id: schoolId,
        student_id: studentId,
        subject: input.subject,
        duration_minutes: minutes,
        session_date: localDate(),
      });
      if (error) throw error;
      return minutes;
    },
    onSuccess: (minutes) => {
      if (minutes) void qc.invalidateQueries({ queryKey: ["study-sessions", schoolId, studentId] });
    },
  });

  /** Fire-and-forget save used on pause / unmount — never blocks the UI. */
  const record = useCallback(
    (seconds: number, subject: string | null) => {
      if (!schoolId || !studentId || seconds < 60) return;
      mutation.mutate({ seconds, subject });
    },
    [mutation, schoolId, studentId],
  );

  return { record, isSaving: mutation.isPending, canRecord: !!schoolId && !!studentId };
}

/** Reads back the student's study log with weekly / all-time roll-ups. */
export function useStudyHistory(studentId: string | null, limit = 20) {
  const { school, profile } = useApp();
  const schoolId = school?.id ?? (profile?.school_id as string | undefined);

  return useQuery({
    queryKey: ["study-sessions", schoolId, studentId, limit],
    enabled: !!schoolId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("id, subject, duration_minutes, session_date, created_at")
        .eq("school_id", schoolId!)
        .eq("student_id", studentId!)
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const sessions = (data ?? []) as StudySession[];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      const weekKey = localDate(weekStart);
      const today = localDate();

      const total = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
      const thisWeek = sessions
        .filter((s) => (s.session_date ?? "") >= weekKey)
        .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
      const todayMinutes = sessions
        .filter((s) => s.session_date === today)
        .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

      const bySubject = new Map<string, number>();
      sessions.forEach((s) => {
        const key = s.subject ?? "General study";
        bySubject.set(key, (bySubject.get(key) ?? 0) + (s.duration_minutes ?? 0));
      });

      return {
        sessions,
        totalMinutes: total,
        weekMinutes: thisWeek,
        todayMinutes,
        topSubjects: Array.from(bySubject.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4),
      };
    },
  });
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
