import SitePage from "@/components/layout/SitePage";
import CareerHero from "@/components/career/CareerHero";
import CareerOpenings from "@/components/career/CareerOpenings";
import JsonLd from "@/components/seo/JsonLd";
import { listCareerOpenings } from "@/lib/careers/career-board";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Careers — Open Job Vacancies",
  description:
    "Browse open BALITECH job vacancies across Sales & Marketing campaigns, management, QA, HR, IT, and support roles in Rawalpindi and Islamabad.",
  path: "/career",
});

export default async function CareerPage() {
  const openings = await listCareerOpenings();

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Careers", path: "/career" }])}
      />
      <div className="career-page">
        <CareerHero openingCount={openings.length} />
        <CareerOpenings openings={openings} />
      </div>
    </SitePage>
  );
}
