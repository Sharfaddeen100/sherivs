import { createFileRoute, Link } from "@tanstack/react-router";
import { PLATFORM_NAME, PLATFORM_PAGE_DESCRIPTION } from "@/lib/platform";
import { PRODUCT_NAME } from "@/lib/public-site/company";
import {
  INSTALLED_RUNTIME_PROOFS,
  SECURITY_GUARANTEES,
  SITE_CAPABILITIES,
} from "./-content/site-content";
import { publicHead } from "@/lib/public-site/seo";
import {
  PageContainer,
  Section,
  SectionHeading,
  FeatureCard,
  PublicButton,
} from "@/components/public/ui";

/**
 * Dedicated Sherivs Scholar product overview at /sherivs.
 * The former /coregrid path redirects here. Nested architecture marketing
 * pages redirect to this product overview.
 */

export const Route = createFileRoute("/(site)/sherivs")({
  component: SherivsPlatformPage,
  head: () =>
    publicHead({
      title: `${PRODUCT_NAME} overview`,
      description: PLATFORM_PAGE_DESCRIPTION,
      path: "/sherivs",
    }),
});

function SherivsPlatformPage() {
  const [runtime] = INSTALLED_RUNTIME_PROOFS;

  return (
    <>
      <section aria-labelledby="scholar-hero" className="border-b border-[var(--sherivs-border)]">
        <PageContainer className="py-16 sm:py-20">
          <p className="sherivs-kicker">{PRODUCT_NAME}</p>
          <h1
            id="scholar-hero"
            className="sherivs-display mt-4 max-w-[16ch] text-3xl font-bold sm:text-5xl"
          >
            A better way to run your school.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sherivs-muted sm:text-lg">
            Bring school administration, academic operations, and your school community together in
            one connected platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PublicButton href="/onboarding">Get started</PublicButton>
            <Link
              to="/auth"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--sherivs-radius-sm)] border border-[var(--sherivs-border-strong)] px-5 py-2.5 text-center text-sm font-semibold hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </PageContainer>
      </section>

      <Section id="capabilities" labelledBy="capabilities-heading">
        <PageContainer className="py-16 sm:py-20">
          <SectionHeading
            id="capabilities-heading"
            eyebrow="Product capabilities"
            title="Everything your school needs to stay in sync."
            lead="The capabilities below are the Scholar workflows available in the product today."
          />
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {SITE_CAPABILITIES.map((capability) => (
              <li key={capability.id}>
                <FeatureCard title={capability.title}>{capability.description}</FeatureCard>
              </li>
            ))}
          </ul>
        </PageContainer>
      </Section>

      <Section id="community" labelledBy="community-heading" tone="muted">
        <PageContainer className="py-16 sm:py-20">
          <SectionHeading
            id="community-heading"
            eyebrow="The product"
            title={`${PLATFORM_NAME} ${runtime.name}`}
            lead={runtime.description}
          />
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-sherivs-muted">
            {runtime.proof}
          </p>
        </PageContainer>
      </Section>

      <Section id="security" labelledBy="security-heading">
        <PageContainer className="py-16 sm:py-20">
          <SectionHeading
            id="security-heading"
            eyebrow="Responsibility"
            title="Built with responsibility in mind."
            lead="School information deserves careful handling. These practices describe the access model implemented in the product — not certifications or independent audits."
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {SECURITY_GUARANTEES.map((item) => (
              <li key={item.id}>
                <FeatureCard title={item.title}>{item.description}</FeatureCard>
              </li>
            ))}
          </ul>
        </PageContainer>
      </Section>
    </>
  );
}
