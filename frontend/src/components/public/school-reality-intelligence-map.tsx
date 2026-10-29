import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageContainer, Section } from "@/components/public/ui";
import {
  SCHOOL_REALITY_BRANCHES,
  SCHOOL_REALITY_CAPABILITIES,
  SCHOOL_REALITY_FLOW,
  SCHOOL_REALITY_GENERATIONS,
  SCHOOL_REALITY_MAP,
  SCHOOL_REALITY_PATHS,
  pathsTouchingBranch,
  relatedBranchIds,
  tracedPathForBranch,
  type SchoolRealityBranch,
} from "@/lib/public-site/school-reality-map";

/**
 * Explanatory map of a school as one living institution.
 * Desktop: centre, eight branches, and connectors in the gutters.
 * Below 1024px: the same centre, then an expandable list.
 */

function buttonId(branchId: string): string {
  return `reality-branch-${branchId}`;
}

function panelId(branchId: string): string {
  return `reality-panel-${branchId}`;
}

export function SchoolRealityIntelligenceMap() {
  const rootRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const traced = selected ? tracedPathForBranch(selected) : undefined;
  const related = new Set(selected ? relatedBranchIds(selected) : []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const reveal = () => {
      root.dataset.revealed = "true";
    };
    root.dataset.motion = "on";
    const rect = root.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 64) {
      reveal();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(root);
    const timeout = window.setTimeout(reveal, 4000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((current) => (current === id ? null : id));
  };

  return (
    <Section id="school-reality" labelledBy="school-reality-title" className="sherivs-map-section">
      <PageContainer className="py-8 sm:py-12 lg:py-14">
        <p id="school-reality-desc" className="sr-only">
          {SCHOOL_REALITY_MAP.description}
        </p>
        <h2
          id="school-reality-title"
          className="sherivs-display max-w-[22ch] text-2xl font-bold sm:text-3xl"
        >
          {SCHOOL_REALITY_MAP.introTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--sherivs-ink)] sm:text-base">
          {SCHOOL_REALITY_MAP.introBody}
        </p>

        <figure
          ref={rootRef}
          className="sherivs-map"
          data-testid="school-reality-map"
          aria-describedby="school-reality-honesty"
        >
          <div className="sherivs-glass-card sherivs-map-card">
            <div className="sherivs-map-organism">
              <div className="sherivs-map-core">
                <div className="sherivs-map-nucleus">
                  <p className="sherivs-map-centre-title" data-sri-label>
                    {SCHOOL_REALITY_MAP.centreTitle}
                  </p>
                  <p className="sherivs-map-centre-body" data-sri-label>
                    {SCHOOL_REALITY_MAP.centreBody}
                  </p>
                </div>
              </div>
              <div className="sherivs-map-list">
                {SCHOOL_REALITY_BRANCHES.map((branch) => (
                  <Branch
                    key={branch.id}
                    branch={branch}
                    open={selected === branch.id}
                    related={related.has(branch.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </div>

            <div className="sherivs-map-paths">
              <h3 className="sherivs-map-kicker">{SCHOOL_REALITY_MAP.pathwaysTitle}</h3>
              <p className="sherivs-map-quiet">{SCHOOL_REALITY_MAP.pathwaysLead}</p>
              <ul>
                {SCHOOL_REALITY_PATHS.map((path) => {
                  const state =
                    !selected || !path.branchIds.includes(selected)
                      ? "idle"
                      : path.id === traced?.id
                        ? "traced"
                        : "linked";
                  return (
                    <li key={path.id} data-path-state={state}>
                      <span className="sherivs-map-path-mark" aria-hidden="true" />
                      <p data-sri-label>
                        <span className="sherivs-map-path-title">{path.title}</span> {path.body}
                        {state === "traced" ? (
                          <span className="sherivs-map-flag"> Traced</span>
                        ) : null}
                        {state === "linked" ? (
                          <span className="sherivs-map-flag"> Linked</span>
                        ) : null}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="sherivs-map-digital">
              <h3 className="sherivs-map-digital-title" data-sri-label>
                {SCHOOL_REALITY_MAP.digitalTitle}
              </h3>
              <ol className="sherivs-map-flow">
                {SCHOOL_REALITY_FLOW.map((step, index) => (
                  <li key={step.index}>
                    <span className="sherivs-map-step-index">
                      {step.index}
                      {index < SCHOOL_REALITY_FLOW.length - 1 ? (
                        <span aria-hidden="true"> →</span>
                      ) : null}
                    </span>
                    <span className="sherivs-map-step-label" data-sri-label>
                      {step.label}
                    </span>
                    {step.inDevelopment ? <DirectionMark /> : null}
                  </li>
                ))}
              </ol>
              <ul className="sherivs-map-capabilities">
                {SCHOOL_REALITY_CAPABILITIES.map((capability) => (
                  <li key={capability.id}>
                    <p className="sherivs-map-cap-title" data-sri-label>
                      {capability.title}
                      {capability.inDevelopment ? <DirectionMark /> : null}
                    </p>
                    <p className="sherivs-map-quiet" data-sri-label>
                      {capability.body}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="sherivs-map-direction-note">{SCHOOL_REALITY_MAP.digitalDirection}</p>
              <p className="sherivs-map-product">
                <span className="sherivs-map-product-name" data-sri-label>
                  {SCHOOL_REALITY_MAP.productName}
                </span>
                <span className="sherivs-map-product-tag" data-sri-label>
                  {SCHOOL_REALITY_MAP.productTagline}
                </span>
              </p>
            </div>

            <div className="sherivs-map-shift">
              <p className="sherivs-map-positioning">{SCHOOL_REALITY_MAP.positioning}</p>
              <div className="sherivs-map-shift-grid">
                <Generation generation={SCHOOL_REALITY_GENERATIONS[0]} />
                <p className="sherivs-map-progression" data-sri-label>
                  {SCHOOL_REALITY_MAP.progression}
                </p>
                <Generation generation={SCHOOL_REALITY_GENERATIONS[1]} />
              </div>
            </div>
          </div>
          <figcaption className="sherivs-map-caption">
            <p data-sri-label>{SCHOOL_REALITY_MAP.caption}</p>
            <p id="school-reality-honesty" className="sherivs-map-honesty" data-sri-label>
              {SCHOOL_REALITY_MAP.honesty}
            </p>
          </figcaption>
        </figure>
      </PageContainer>
    </Section>
  );
}

function DirectionMark() {
  return <span className="sherivs-map-direction">In development</span>;
}

function Generation({ generation }: { generation: (typeof SCHOOL_REALITY_GENERATIONS)[number] }) {
  return (
    <article className="sherivs-map-generation">
      <p className="sherivs-map-kicker" data-sri-label>
        {generation.kicker}
      </p>
      <p className="sherivs-map-generation-subject" data-sri-label>
        {generation.subject}
      </p>
      <p className="sherivs-map-quiet" data-sri-label>
        {generation.body}
      </p>
      <ul className="sherivs-map-examples">
        {generation.examples.map((example) => (
          <li key={example} data-sri-label>
            {example}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Branch({
  branch,
  open,
  related,
  onToggle,
}: {
  branch: SchoolRealityBranch;
  open: boolean;
  related: boolean;
  onToggle: (id: string) => void;
}) {
  const state = open ? "selected" : related ? "related" : "idle";
  const traced = tracedPathForBranch(branch.id);
  const others = pathsTouchingBranch(branch.id).filter((path) => path.id !== traced?.id);

  return (
    <div className="sherivs-map-slot" data-branch={branch.id} data-side={branch.side}>
      <h3 className="sherivs-map-heading">
        <button
          type="button"
          id={buttonId(branch.id)}
          className="sherivs-map-button"
          data-side={branch.side}
          data-state={state}
          data-branch={branch.id}
          aria-expanded={open}
          aria-controls={panelId(branch.id)}
          onClick={() => onToggle(branch.id)}
        >
          <span className="sherivs-map-label">
            <span className="sherivs-map-index" data-sri-label>
              {branch.index}
            </span>
            <span className="sherivs-map-branch-name" data-sri-label>
              {branch.heading}
            </span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className="sherivs-disclosure-icon" />
        </button>
      </h3>
      <div
        id={panelId(branch.id)}
        role="region"
        aria-labelledby={buttonId(branch.id)}
        hidden={!open}
        className="sherivs-map-panel"
      >
        <ul className="sherivs-map-activities">
          {branch.labels.map((label) => (
            <li key={label} data-sri-label>
              {label}
            </li>
          ))}
        </ul>
        <p className="sherivs-map-microcopy" data-sri-label>
          {branch.microcopy}
        </p>
        {branch.boundary ? (
          <p className="sherivs-map-boundary" data-sri-label>
            {branch.boundary}
          </p>
        ) : null}
        {traced ? (
          <p className="sherivs-map-traced">
            <span className="sherivs-map-flag">Traced path.</span> {traced.body}
          </p>
        ) : null}
        {others.map((path) => (
          <p key={path.id} className="sherivs-map-traced">
            <span className="sherivs-map-flag">Also crosses.</span> {path.body}
          </p>
        ))}
      </div>
    </div>
  );
}
