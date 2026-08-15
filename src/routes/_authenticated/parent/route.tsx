import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/parent")({
  component: () => (
    <RoleGuard allow={["parent"]}>
      <Outlet />
    </RoleGuard>
  ),
});
