import { createFileRoute, redirect } from "@tanstack/react-router";

// Spec calls the single sign-in URL `/login`; the actual page lives at `/auth`.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
