import { createFileRoute } from "@tanstack/react-router";
import { PortalPage } from "@/components/portal-shell";
import { NewsList } from "@/components/news-list";

export const Route = createFileRoute("/_authenticated/teacher/news")({
  component: () => (
    <PortalPage title="News" subtitle="School announcements and bulletins.">
      <NewsList />
    </PortalPage>
  ),
});
