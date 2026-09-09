import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KERNEL_CAPABILITIES,
  kernelCapabilitiesConsumedByScholar,
  type KernelCapability,
} from "@/lib/kernel/kernel-capability-registry";

export const Route = createFileRoute("/platform")({
  component: Platform,
  head: () => ({
    meta: [
      { title: "CoreGrid — the platform that powers any organization" },
      {
        name: "description",
        content:
          "One governed platform: identity, tenancy, workspaces, AI, security, analytics and 50 kernel capabilities any organization — including Scholar schools — can consume.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function groupByPhase(capabilities: readonly KernelCapability[]): Array<{
  phase: string;
  capabilities: KernelCapability[];
}> {
  const groups = new Map<string, KernelCapability[]>();
  for (const capability of capabilities) {
    const list = groups.get(capability.ownerPhase) ?? [];
    list.push(capability);
    groups.set(capability.ownerPhase, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([phase, capabilities]) => ({ phase, capabilities }));
}

function Platform() {
  const phaseGroups = groupByPhase(KERNEL_CAPABILITIES);
  const scholar = kernelCapabilitiesConsumedByScholar();

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="font-display text-lg font-bold">CoreGrid</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Command Centre
            </Link>
            <a href="/auth" className="text-muted-foreground hover:text-foreground">
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <section className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One platform. Every organization. Their rules.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            CoreGrid is a governed intelligence platform. Whatever an organization runs — a school,
            a ministry, a company — CoreGrid adapts: identity and tenancy first, then the workspace
            and domain surfaces the organization actually uses. Nothing is forced on anyone.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold">50 kernel capabilities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every capability below is owned by a platform phase. Organizations consume the ones they
            need; runtimes never rewrite the kernel.
          </p>
        </section>

        <div className="space-y-6">
          {phaseGroups.map(({ phase, capabilities }) => (
            <section key={phase}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Phase {phase}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {capabilities.map((capability) => (
                  <article key={capability.id} className="rounded-lg border border-border p-3">
                    <h4 className="text-sm font-semibold">{capability.label}</h4>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {capability.id}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-border bg-muted/20 p-6">
          <h2 className="font-display text-lg font-semibold">
            Scholar (the education runtime) consumes {scholar.length} kernel capabilities
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A school inherits the platform's governed core — identity, tenancy, security,
            workspaces, AI — and adds only its own education domain. Remove Scholar and the kernel
            stays fully valid.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scholar.map((capability) => (
              <span
                key={capability.id}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
              >
                {capability.label}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        CoreGrid · governed intelligence platform · every runtime is a tenant of the kernel, never
        its owner.
      </footer>
    </div>
  );
}
