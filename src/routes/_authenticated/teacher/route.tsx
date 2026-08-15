import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: () => (
    <RoleGuard allow={["teacher"]}>
      <Outlet />
    </RoleGuard>
  ),
});
