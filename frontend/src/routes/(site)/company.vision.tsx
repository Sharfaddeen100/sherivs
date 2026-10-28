import { createFileRoute } from "@tanstack/react-router";
import {
  COMPANY_APPROACH,
  COMPANY_MISSION,
  COMPANY_VISION,
  POSITIONING_FOUNDATIONS,
  POSITIONING_PROGRAMMABLE,
  POSITIONING_RETHINKING,
  POSITIONING_STATEMENT,
  PRODUCT_NAME,
} from "@/lib/public-site/company";
import { publicHead } from "@/lib/public-site/seo";
import { MarketingPage } from "@/components/public/marketing-page";
import { GlassPanel, PageContainer, Section } from "@/components/public/ui";

export const Route = createFileRoute("/(site)/company/vision")({
  component: VisionPage,
  head: () =>
    publicHead({
      title: "Vision and mission",
      description: COMPANY_VISION,
      path: "/company/vision",
    }),
});

function VisionPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="Vision and mission"
      lead={COMPANY_VISION}
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/about", label: "Company" },
        { href: "/company/vision", label: "Vision" },
      ]}
    >
      <Section labelledBy="mission-heading">
        <PageContainer className="py-16">
          <div className="sherivs-stagger mx-auto grid max-w-3xl gap-4 text-sm leading-relaxed text-sherivs-muted sm:text-base">
            <GlassPanel className="space-y-3">
              <h2
                id="mission-heading"
                className="font-display text-xl font-semibold text-[var(--sherivs-ink)]"
              >
                Mission
              </h2>
              <p>{COMPANY_MISSION}</p>
            </GlassPanel>
            <GlassPanel className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-[var(--sherivs-ink)]">
                Vision
              </h2>
              <p>{COMPANY_VISION}</p>
            </GlassPanel>
            <GlassPanel className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-[var(--sherivs-ink)]">
                Our approach
              </h2>
              <p>{COMPANY_APPROACH}</p>
              <p>{POSITIONING_FOUNDATIONS}</p>
            </GlassPanel>
            <GlassPanel className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-[var(--sherivs-ink)]">
                What that means today
              </h2>
              <p>{POSITIONING_STATEMENT}</p>
              <p>{POSITIONING_RETHINKING}</p>
              <p>{POSITIONING_PROGRAMMABLE}</p>
              <p>
                {PRODUCT_NAME} is the product schools can use now. Additional products may follow.
                This page does not treat unpublished capabilities as available.
              </p>
            </GlassPanel>
          </div>
        </PageContainer>
      </Section>
    </MarketingPage>
  );
}
