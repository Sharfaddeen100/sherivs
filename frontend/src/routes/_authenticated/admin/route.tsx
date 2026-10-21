import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAreaGuard } from "@/components/admin-area-guard";

// Admin/principal for everything; registrars (active registrar position) get /admin/admissions only.
export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <AdminAreaGuard>
      <Outlet />
    </AdminAreaGuard>
  ),
});
