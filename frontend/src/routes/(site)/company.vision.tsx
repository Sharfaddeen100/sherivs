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
import { PageContainer, Section } from "@/components/public/ui";

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
        <PageContainer className="max-w-3xl space-y-8 py-16 text-sm leading-relaxed text-sherivs-muted sm:text-base">
          <div className="space-y-3">
            <h2
              id="mission-heading"
              className="font-display text-xl font-semibold text-sherivs-white"
            >
              Mission
            </h2>
            <p>{COMPANY_MISSION}</p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-sherivs-white">Vision</h2>
            <p>{COMPANY_VISION}</p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-sherivs-white">Our approach</h2>
            <p>{COMPANY_APPROACH}</p>
            <p>{POSITIONING_FOUNDATIONS}</p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-sherivs-white">
              What that means today
            </h2>
            <p>{POSITIONING_STATEMENT}</p>
            <p>{POSITIONING_RETHINKING}</p>
            <p>{POSITIONING_PROGRAMMABLE}</p>
            <p>
              {PRODUCT_NAME} is the product schools can use now. Additional products may follow.
              This page does not treat unpublished capabilities as available.
            </p>
          </div>
        </PageContainer>
      </Section>
    </MarketingPage>
  );
}
