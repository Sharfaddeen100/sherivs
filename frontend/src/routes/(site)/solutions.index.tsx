import { createFileRoute } from "@tanstack/react-router";
import { PRODUCT_NAME } from "@/lib/public-site/company";
import { publicHead } from "@/lib/public-site/seo";
import { MarketingPage } from "@/components/public/marketing-page";
import { FeatureCard, PageContainer, Section } from "@/components/public/ui";

export const Route = createFileRoute("/(site)/solutions/")({
  component: SolutionsPage,
  head: () =>
    publicHead({
      title: "Solutions for schools",
      description:
        "Sherivs Scholar covers school administration, academic operations, and the school community in one organized environment.",
      path: "/solutions",
    }),
});

function SolutionsPage() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="Built for schools."
      lead={`${PRODUCT_NAME} is the current product. It serves schools — not a catalogue of unlaunched industries.`}
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/solutions", label: "Solutions" },
      ]}
    >
      <Section labelledBy="solutions-heading">
        <PageContainer className="py-16">
          <h2 id="solutions-heading" className="sr-only">
            School solutions
          </h2>
          <ul className="grid gap-4 lg:grid-cols-3">
            <li>
              <FeatureCard title="Schools" href="/solutions/education">
                A connected operating environment for the people and processes that run a school.
              </FeatureCard>
            </li>
            <li>
              <FeatureCard title="School administration" href="/#administration">
                Keep essential school records and administrative workflows organized.
              </FeatureCard>
            </li>
            <li>
              <FeatureCard title="Academic operations" href="/#academic">
                Manage the academic records and everyday processes your school uses.
              </FeatureCard>
            </li>
          </ul>
        </PageContainer>
      </Section>
    </MarketingPage>
  );
}
