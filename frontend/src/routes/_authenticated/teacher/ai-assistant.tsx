import { createFileRoute } from "@tanstack/react-router";
import { PortalPage } from "@/components/portal-shell";
import { TeacherAIAssistant } from "@/components/ai/teacher-ai-assistant";

export const Route = createFileRoute("/_authenticated/teacher/ai-assistant")({
  ssr: false,
  component: TeacherAssistantPage,
});

function TeacherAssistantPage() {
  return (
    <PortalPage title="Teacher Assistant" subtitle="Your personal AI teaching companion">
      <TeacherAIAssistant />
    </PortalPage>
  );
}
