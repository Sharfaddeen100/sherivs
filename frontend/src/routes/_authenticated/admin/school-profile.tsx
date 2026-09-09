import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalPage } from "@/components/portal-shell";
import { RoleGuard } from "@/components/role-guard";
import { recommendTemplates } from "@/lib/onboarding/template-engine";
import {
  SCHOLAR_SCHOOL_TEMPLATES,
  SCHOLAR_TEMPLATE_FEATURES,
  type TemplateFeature,
} from "@/lib/runtime/scholar-school-templates";

export const Route = createFileRoute("/_authenticated/admin/school-profile")({
  ssr: false,
  component: () => (
    <RoleGuard allow={["admin", "principal"]}>
      <SchoolProfilePage />
    </RoleGuard>
  ),
});

function SchoolProfilePage() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, TemplateFeature[]>();
    for (const feature of SCHOLAR_TEMPLATE_FEATURES) {
      const list = map.get(feature.group);
      if (list) list.push(feature);
      else map.set(feature.group, [feature]);
    }
    return [...map.entries()];
  }, []);

  const recommendations = useMemo(
    () => recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, selected),
    [selected],
  );

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  return (
    <PortalPage
      title="School profile & templates"
      subtitle="Tell CoreGrid what your school actually does — nothing is forced. Matching templates are suggested and you keep full control of every feature."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="uos-card p-5">
          <h2 className="mb-1 font-display text-base font-semibold">What does your school run?</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Tick every box that applies. CoreGrid adapts to you — religious, vocational, boarding,
            double-shift, multi-campus and everything between.
          </p>
          {groups.map(([group, features]) => (
            <fieldset key={group} className="mb-4">
              <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group}
              </legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {features.map((feature) => (
                  <label
                    key={feature.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(feature.key)}
                      onChange={() => toggle(feature.key)}
                      className="size-3.5 accent-primary"
                    />
                    {feature.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear all selections
            </button>
          )}
        </section>

        <section className="uos-card p-5">
          <h2 className="mb-1 font-display text-base font-semibold">Recommended templates</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Best matches appear first. A template is only a suggestion — adopt it as a starting
            point and change anything afterwards.
          </p>
          {recommendations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              {selected.size === 0
                ? "Select at least one feature above to see template suggestions."
                : "No template matches those choices — that is fine. CoreGrid still supports your school; you simply keep your own mix."}
            </p>
          ) : (
            <ul className="space-y-2">
              {recommendations.map(({ template, matchedKeys, uncoveredKeys }) => (
                <li key={template.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{template.title}</div>
                    <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {matchedKeys} match{matchedKeys === 1 ? "" : "es"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                  {uncoveredKeys.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Your other choices ({uncoveredKeys.length}) stay on — nothing is removed.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalPage>
  );
}
