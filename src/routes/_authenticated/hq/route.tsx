import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/hq")({
  component: () => (
    <RoleGuard allow={["hq"]}>
      <Outlet />
    </RoleGuard>
  ),
});
