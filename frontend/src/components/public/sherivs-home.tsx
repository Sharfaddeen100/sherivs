import {
  COMPANY_APPROACH,
  COMPANY_MISSION,
  COMPANY_VISION,
  PRODUCT_NAME,
} from "@/lib/public-site/company";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { HeroProductVisual } from "@/components/public/hero-product-visual";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { JsonLd } from "@/components/public/json-ld";
import { PageContainer, Section, SectionHeading, PublicButton } from "@/components/public/ui";
import {
  SCHOLAR_AUDIENCES,
  SCHOLAR_CAPABILITIES,
  SCHOLAR_PATH_STEPS,
  SCHOLAR_PRINCIPLES,
  SCHOLAR_TRUST,
} from "@/lib/public-site/scholar";
import { FAQ_ITEMS, FAQ_PREVIEW_IDS } from "@/lib/public-site/faq";
import { organizationJsonLd, softwareJsonLd } from "@/lib/public-site/seo";
import { PublicLink } from "@/components/public/public-link";

/**
 * Sherivs public company homepage.
 *
 * PLANE 1 — sherivs.com. Introduces Sherivs Scholar as the first product
 * without exposing internal architecture, unlaunched product families, or
 * fabricated social proof.
 */

const FAQ_PREVIEW = FAQ_ITEMS.filter((item) =>
  (FAQ_PREVIEW_IDS as readonly string[]).includes(item.id),
);

export function SherivsHome() {
  return (
    <div className="sherivs-public flex min-h-dvh flex-col bg-sherivs-obsidian text-sherivs-white">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={softwareJsonLd()} />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <ProductExperienceSection />
        <AdvantageSection />
        <AudienceSection />
        <PathSection />
        <MissionSection />
        <TrustSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <Section labelledBy="sherivs-hero" className="relative overflow-hidden">
      <div className="sherivs-hero-atmosphere sherivs-grid-fade" />
      <PageContainer
        wide
        className="relative grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24"
      >
        <div>
          <p className="sherivs-kicker sherivs-enter">{PRODUCT_NAME}</p>
          <h1
            id="sherivs-hero"
            className="sherivs-display sherivs-enter sherivs-enter-2 mt-4 max-w-[14ch] text-[2.15rem] font-bold sm:text-5xl lg:text-[3.35rem]"
          >
            A better way to run your school.
          </h1>
          <p className="sherivs-enter sherivs-enter-3 mt-5 max-w-xl text-base leading-relaxed text-sherivs-muted sm:text-lg">
            Bring school administration, academic operations, and your school community together in
            one connected platform.
          </p>
          <p className="sherivs-enter sherivs-enter-3 mt-3 max-w-xl text-sm leading-relaxed text-sherivs-muted sm:text-base">
            From everyday school records to the workflows that keep a school moving, Sherivs Scholar
            gives your team a more coherent way to manage school life.
          </p>
          <div className="sherivs-enter sherivs-enter-4 mt-8 flex flex-col gap-3 sm:flex-row">
            <PublicButton href="/solutions/education">Explore Sherivs Scholar</PublicButton>
            <PublicButton href="/onboarding" variant="secondary">
              Get started
            </PublicButton>
          </div>
        </div>
        <HeroProductVisual className="sherivs-enter sherivs-enter-3" />
      </PageContainer>
    </Section>
  );
}

function ProductExperienceSection() {
  return (
    <Section id="platform" labelledBy="platform-heading" tone="muted">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="platform-heading"
          eyebrow="The platform"
          title="Everything your school needs to stay in sync."
          lead="Bring the people, records, and everyday processes of your school into one organized environment."
        />
        <ul id="capabilities" className="mt-10 grid gap-4 md:grid-cols-2">
          {SCHOLAR_CAPABILITIES.map((card, index) => (
            <li key={card.id} id={card.id}>
              <PublicLink
                href={card.href}
                className="group block h-full rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] bg-[color-mix(in_oklab,var(--sherivs-navy)_55%,transparent)] p-6 shadow-[var(--sherivs-shadow-card)] transition-[transform,border-color] duration-[var(--sherivs-motion-fast)] hover:-translate-y-0.5 hover:border-[var(--sherivs-glass-border)]"
              >
                <p className="font-display text-xs font-semibold tracking-[0.16em] text-sherivs-cyan">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sherivs-muted">{card.body}</p>
              </PublicLink>
            </li>
          ))}
        </ul>
      </PageContainer>
    </Section>
  );
}

function AdvantageSection() {
  return (
    <Section labelledBy="advantage-heading">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="advantage-heading"
          eyebrow="Why Sherivs Scholar"
          title="Less fragmentation. More clarity."
          lead="School operations work better when essential information and everyday workflows belong to the same operating environment."
        />
        <ol className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-10">
          {SCHOLAR_PRINCIPLES.map((item, index) => (
            <li key={item.id} className="relative border-t border-[var(--sherivs-border)] pt-6">
              <p className="font-display text-sm font-semibold text-sherivs-cyan">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-sherivs-muted sm:text-base">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </Section>
  );
}

function AudienceSection() {
  const featured = SCHOLAR_AUDIENCES[0];
  const rest = SCHOLAR_AUDIENCES.slice(1);
  return (
    <Section id="community" labelledBy="community-heading" tone="paper">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="community-heading"
          eyebrow="Designed for the school community"
          title="One school. A more connected experience."
          lead="Give each member of the school community a clearer place to access the information and workflows relevant to them."
        />
        <div className="mt-10 grid gap-4">
          <article className="rounded-[var(--sherivs-radius-lg)] border border-black/10 bg-white p-7 shadow-[0_20px_50px_rgba(18,24,38,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1558d6]">
              Featured
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold">{featured.title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--sherivs-ink-muted)] sm:text-base">
              {featured.body}
            </p>
          </article>
          <ul className="grid gap-4 sm:grid-cols-3">
            {rest.map((audience) => (
              <li
                key={audience.id}
                className="rounded-[var(--sherivs-radius)] border border-black/10 bg-white/70 p-5"
              >
                <h3 className="font-display text-base font-semibold">{audience.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--sherivs-ink-muted)]">
                  {audience.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </Section>
  );
}

function PathSection() {
  return (
    <Section labelledBy="path-heading">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="path-heading"
          eyebrow="Getting started"
          title="A clearer path to running your school."
          lead="Sherivs provisions the organization's admin account. That admin then invites the rest of the school community."
        />
        <ol className="mt-12 grid gap-0 lg:grid-cols-3">
          {SCHOLAR_PATH_STEPS.map((item, index) => (
            <li
              key={item.step}
              className={`relative px-0 py-6 lg:px-8 lg:py-0 ${index < SCHOLAR_PATH_STEPS.length - 1 ? "lg:border-r lg:border-[var(--sherivs-border)]" : ""}`}
            >
              <p className="font-display text-sm font-bold text-sherivs-cyan">{item.step}</p>
              <h3 className="mt-3 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-sherivs-muted sm:text-base">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </Section>
  );
}

function MissionSection() {
  return (
    <Section id="mission" labelledBy="mission-heading" tone="muted">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="mission-heading"
          eyebrow="Vision and mission"
          title="A company direction schools can understand today."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] p-6">
            <h3 className="font-display text-lg font-semibold">Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-sherivs-muted">{COMPANY_VISION}</p>
          </article>
          <article className="rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] p-6">
            <h3 className="font-display text-lg font-semibold">Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-sherivs-muted">{COMPANY_MISSION}</p>
          </article>
          <article className="rounded-[var(--sherivs-radius)] border border-[var(--sherivs-border)] bg-[color-mix(in_oklab,var(--sherivs-navy)_70%,transparent)] p-6">
            <h3 className="font-display text-lg font-semibold">Our approach</h3>
            <p className="mt-3 text-sm leading-relaxed text-sherivs-muted">{COMPANY_APPROACH}</p>
          </article>
        </div>
      </PageContainer>
    </Section>
  );
}

function TrustSection() {
  return (
    <Section labelledBy="trust-heading">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="trust-heading"
          eyebrow="Responsibility"
          title="Built with responsibility in mind."
          lead="School information deserves careful handling. Sherivs Scholar focuses on appropriate access, clear responsibilities, and the protection of institutional information."
        />
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOLAR_TRUST.map((item) => (
            <li key={item.id} className="border-t border-[var(--sherivs-border)] pt-5">
              <h3 className="font-display text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sherivs-muted">{item.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-sherivs-muted">
          Read the{" "}
          <PublicLink
            href="/privacy-policy"
            className="text-sherivs-cyan underline-offset-4 hover:underline"
          >
            privacy policy
          </PublicLink>{" "}
          and the{" "}
          <PublicLink
            href="/trust"
            className="text-sherivs-cyan underline-offset-4 hover:underline"
          >
            trust center
          </PublicLink>
          . Sherivs does not display certification badges or audit claims that are not on file.
        </p>
      </PageContainer>
    </Section>
  );
}

function FaqSection() {
  return (
    <Section id="faq" labelledBy="faq-heading" tone="muted">
      <PageContainer className="py-16 sm:py-20">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Questions schools actually ask."
          lead="Concise answers about Sherivs Scholar, onboarding, parent access, and support."
        />
        <div className="mt-10">
          <FaqAccordion items={FAQ_PREVIEW} />
        </div>
        <div className="mt-6">
          <PublicButton href="/faq" variant="text">
            All questions
          </PublicButton>
        </div>
      </PageContainer>
    </Section>
  );
}

function FinalCtaSection() {
  return (
    <Section labelledBy="cta-heading">
      <PageContainer className="py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[var(--sherivs-radius-lg)] border border-[var(--sherivs-glass-border)] bg-[color-mix(in_oklab,var(--sherivs-navy)_70%,transparent)] px-6 py-12 text-center sm:px-12">
          <div className="sherivs-hero-atmosphere opacity-70" />
          <div className="relative">
            <h2 id="cta-heading" className="sherivs-display text-2xl font-bold sm:text-4xl">
              Give your school a more connected way to work.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-sherivs-muted sm:text-base">
              Discover how Sherivs Scholar can bring greater clarity to your school&apos;s everyday
              operations.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PublicButton href="/onboarding">Get started</PublicButton>
              <PublicButton href="/contact" variant="secondary">
                Contact Sherivs
              </PublicButton>
            </div>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
