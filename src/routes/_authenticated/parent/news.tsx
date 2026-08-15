import { createFileRoute } from "@tanstack/react-router";
import { PortalPage } from "@/components/portal-shell";
import { NewsList } from "@/components/news-list";

export const Route = createFileRoute("/_authenticated/parent/news")({
  component: () => (
    <PortalPage title="News" subtitle="Announcements from your child's school.">
      <NewsList />
    </PortalPage>
  ),
});
