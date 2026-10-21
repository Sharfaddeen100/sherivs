import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Former path of the Sherivs platform page (Sherivs was the former name of the
 * Sherivs platform). Kept as a permanent redirect so existing links keep working.
 */
export const Route = createFileRoute("/(site)/coregrid")({
  beforeLoad: () => {
    throw redirect({ to: "/sherivs", replace: true, statusCode: 301 });
  },
});
