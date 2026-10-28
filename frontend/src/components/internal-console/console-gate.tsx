import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useApp } from "@/contexts/app-context";
import {
  CONSOLE_HOME_PATH,
  currentEffectiveHostKind,
  decideHostRoute,
  isConsoleOperator,
} from "@/lib/experience/console-host-routing";
import { ConsoleNotAuthorised } from "./not-authorised";
import { ConsoleElsewhere } from "./not-authorised";
import { ConsoleLoadingState } from "./console-primitives";
import "./console.css";

export function ConsoleGate({ children }: { children?: ReactNode }) {
  const app = useApp();
  const location = useLocation();
  const hostKind = currentEffectiveHostKind();
  const operator = isConsoleOperator(app);

  if (app.loading) {
    return <ConsoleLoadingState message="Signing you in to the Internal Console…" />;
  }

  const decision = decideHostRoute({
    hostKind,
    pathname: location.pathname,
    signedIn: Boolean(app.authUser),
    isConsoleOperator: operator,
  });

  if (decision.kind === "redirect") {
    if (decision.to === "/auth") return <Navigate to="/auth" />;
    return <Navigate to={decision.to as never} />;
  }
  if (decision.kind === "not_authorised") return <ConsoleNotAuthorised />;
  if (decision.kind === "console_elsewhere") return <ConsoleElsewhere />;
  if (hostKind === "internal" && location.pathname === "/") {
    return <Navigate to={CONSOLE_HOME_PATH as never} />;
  }
  return children ?? <Navigate to={CONSOLE_HOME_PATH as never} />;
}
