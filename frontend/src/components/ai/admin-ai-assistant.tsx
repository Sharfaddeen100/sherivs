import { useApp } from "@/contexts/app-context";
import { AIAssistantShell, type QuickPrompt } from "@/components/ai/ai-assistant-shell";

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "School overview", prompt: "Give me today's school health summary" },
  { label: "Fee collection status", prompt: "What is the current fee collection rate?" },
  { label: "At-risk students", prompt: "Which students need intervention this week?" },
  { label: "Teacher performance", prompt: "Summarize teacher attendance this week" },
  { label: "Generate report", prompt: "Generate an executive summary for this week" },
];

export function AdminAIAssistant() {
  const { profile, school } = useApp();
  const userId = profile?.id;
  const schoolId = school?.id ?? profile?.school_id;

  if (!userId || !schoolId) return null;

  return (
    <AIAssistantShell
      portalName="admin"
      assistantName="Vibeora Command AI"
      systemContext="I have visibility across your whole school — enrolment, attendance, fees, results, staff and transport."
      quickPrompts={QUICK_PROMPTS}
      userId={userId}
      schoolId={schoolId}
      scope={{ subjectLabel: "your school" }}
    />
  );
}

export default AdminAIAssistant;
