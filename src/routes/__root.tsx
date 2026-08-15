import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppProvider } from "@/contexts/app-context";
import { Toaster } from "@/components/ui/sonner";
import { RouteProgressBar } from "@/components/route-progress-bar";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset?: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground break-words">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {reset && (
            <button
              onClick={() => reset()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Universal School OS" },
      {
        name: "description",
        content:
          "Universal School OS — a multi-tenant school management platform for admissions, academics, attendance, fees, and parent engagement.",
      },
      { property: "og:title", content: "Universal School OS" },
      { name: "twitter:title", content: "Universal School OS" },
      { name: "description", content: "A multi-tenant School Management SaaS for comprehensive school administration." },
      { property: "og:description", content: "A multi-tenant School Management SaaS for comprehensive school administration." },
      { name: "twitter:description", content: "A multi-tenant School Management SaaS for comprehensive school administration." },
      { property: "og:image", content: "https://universalschoolos.com/og-image.png" },
      { name: "twitter:image", content: "https://universalschoolos.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouteProgressBar />
        <Outlet />
        <Toaster richColors closeButton position="top-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
