/**
 * Illustrative composition of a connected school operating environment.
 * These panels are conceptual — they are not screenshots of a live tenant.
 */
export function HeroProductVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative isolate ${className}`} aria-hidden="true">
      <div className="sherivs-hero-atmosphere" />
      <div className="relative mx-auto w-full max-w-[34rem]">
        <div className="sherivs-glass sherivs-drift rounded-[var(--sherivs-radius-lg)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="sherivs-kicker">School workspace</p>
              <p className="mt-1 font-display text-base font-semibold">Administration</p>
            </div>
            <span className="rounded-full border border-[var(--sherivs-border-strong)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-sherivs-muted">
              Illustrative
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Panel
              title="School records"
              body="Organization profile, people, and essential administrative information."
            />
            <Panel
              title="Academic year"
              body="Classes, subjects, and the records that keep the term moving."
            />
          </div>
          <div className="mt-3 rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] bg-[color-mix(in_oklab,var(--sherivs-obsidian)_55%,transparent)] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-sherivs-muted">
              Roles in this school
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {["Admin", "Teacher", "Student", "Parent"].map((role) => (
                <li
                  key={role}
                  className="rounded-[var(--sherivs-radius-sm)] border border-[var(--sherivs-border)] bg-white/5 px-2 py-2 text-center"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sherivs-glass absolute -left-2 top-[62%] hidden w-44 rounded-[var(--sherivs-radius)] p-3 sm:block lg:-left-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sherivs-cyan">
            Class activity
          </p>
          <p className="mt-1 text-sm font-medium">Attendance register</p>
          <p className="mt-1 text-xs leading-snug text-sherivs-muted">
            Teachers record the day’s class information in their workspace.
          </p>
        </div>
        <div className="sherivs-glass absolute -right-2 top-8 hidden w-44 rounded-[var(--sherivs-radius)] p-3 sm:block lg:-right-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sherivs-cyan">
            Family access
          </p>
          <p className="mt-1 text-sm font-medium">Parent workspace</p>
          <p className="mt-1 text-xs leading-snug text-sherivs-muted">
            Guardians see the records the school has authorized.
          </p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] bg-[color-mix(in_oklab,var(--sherivs-obsidian)_45%,transparent)] p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-sherivs-muted">{body}</p>
    </div>
  );
}
