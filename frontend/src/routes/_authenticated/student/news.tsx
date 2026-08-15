import { createFileRoute } from "@tanstack/react-router";
import { PortalPage } from "@/components/portal-shell";
import { NewsList } from "@/components/news-list";

export const Route = createFileRoute("/_authenticated/student/news")({
  component: () => (
    <PortalPage title="News" subtitle="Latest from your school.">
      <NewsList />
    </PortalPage>
  ),
});
