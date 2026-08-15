import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/contexts/app-context";
import { dashboardPathForRole } from "@/lib/roles";
import { PublicSchoolSite } from "@/components/public/site";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Universal School OS — one platform for every school" },
      {
        name: "description",
        content:
          "Multi-tenant school management for admissions, academics, attendance, fees, parents, and a tenant-branded marketing site — all in one place.",
      },
      { property: "og:title", content: "Universal School OS" },
      {
        property: "og:description",
        content:
          "Run admissions, academics, attendance, fees, and your public school site on one platform.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://universalschoolos.com/" },
    ],
    links: [{ rel: "canonical", href: "https://universalschoolos.com/" }],
  }),
});

function Index() {
  const { loading, school, tenantSlug, role, profile, superAdmin } = useApp();
  const navigate = useNavigate();

  // Signed-in users (on the platform host, not a tenant site) → their dashboard
  useEffect(() => {
    if (!loading && role && !tenantSlug) {
      navigate({ to: dashboardPathForRole(role), replace: true });
    }
  }, [loading, role, tenantSlug, navigate]);

  // Per-tenant document title + meta description + OG image + JSON-LD
  useEffect(() => {
    if (!school) return;
    const prevTitle = document.title;
    const tagline =
      (school.hero_subheadline as string | null) ??
      (school.motto as string | null) ??
      "Official school website";
    document.title = `${school.name} — ${tagline}`;
    const desc = ((school.about as string | null) ?? tagline).slice(0, 300);

    function upsertMeta(attr: "name" | "property", key: string, value: string) {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      const prev = tag?.content ?? null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.content = value;
      return () => {
        if (!tag) return;
        if (prev === null) tag.remove();
        else tag.content = prev;
      };
    }

    const cleanup: Array<() => void> = [];
    cleanup.push(upsertMeta("name", "description", desc));
    cleanup.push(upsertMeta("property", "og:title", `${school.name}`));
    cleanup.push(upsertMeta("property", "og:description", desc));
    cleanup.push(upsertMeta("property", "og:type", "website"));
    cleanup.push(upsertMeta("property", "og:url", window.location.href));
    const logo = (school.logo_url as string | null) ?? null;
    if (logo) {
      cleanup.push(upsertMeta("property", "og:image", logo));
      cleanup.push(upsertMeta("name", "twitter:image", logo));
    }
    cleanup.push(upsertMeta("name", "twitter:card", logo ? "summary_large_image" : "summary"));

    // JSON-LD: EducationalOrganization + BreadcrumbList
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    const phone = (school.phone as string | null) ?? undefined;
    const email = (school.email as string | null) ?? undefined;
    ld.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: school.name,
        description: desc,
        url: window.location.href,
        logo: logo ?? undefined,
        email,
        telephone: phone,
        address: (school.address as string | null)
          ? { "@type": "PostalAddress", streetAddress: school.address as string }
          : undefined,
        contactPoint:
          phone || email
            ? {
                "@type": "ContactPoint",
                contactType: "admissions",
                telephone: phone,
                email,
              }
            : undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: window.location.href },
        ],
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      cleanup.forEach((fn) => fn());
      ld.remove();
    };
  }, [school]);

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Tenant context (subdomain OR ?school=slug) → render that school's public site
  if (school) {
    return <PublicSchoolSite school={school} />;
  }

  // Platform marketing page — only when no tenant slug resolved
  const continueHref = role ? dashboardPathForRole(role) : null;
  const greetingName = profile?.full_name ?? superAdmin?.full_name ?? null;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg uos-tenant-bg grid place-items-center font-bold">U</div>
            <span className="font-display font-bold">Universal School OS</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {continueHref ? (
              <Link
                to={continueHref}
                className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground"
              >
                {greetingName ? `Continue as ${greetingName.split(" ")[0]}` : "Open dashboard"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          One operating system for every school.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Admissions, academics, attendance, fees, parent engagement, and a
          tenant-branded marketing site — running on a single multi-tenant
          backend with strict per-school isolation.
        </p>
        <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl">
          {[
            { title: "Multi-tenant by default", body: "Every record is scoped to a school. Database RLS enforces isolation." },
            { title: "Role-based portals", body: "Seven portals — super admin, admin, teacher, bursar, parent, student, HQ." },
            { title: "Real data, real empty states", body: "No mock content. Add your data and it appears. Add nothing and you see guidance." },
          ].map((f) => (
            <div key={f.title} className="uos-card p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Universal School OS
        </div>
      </footer>
    </div>
  );
}
