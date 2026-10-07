import { notFound, permanentRedirect } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import CareerJobDetail from "@/components/career/CareerJobDetail";
import JsonLd from "@/components/seo/JsonLd";
import {
  careerDetailHref,
  getCareerOpening,
  listCareerOpenings,
} from "@/lib/careers/career-board";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const openings = await listCareerOpenings();
  return openings.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const opening = await getCareerOpening(slug);
  if (!opening) {
    return pageMetadata({
      title: "Role not found",
      description: "This job opening is no longer available.",
      path: `/career/${slug}`,
    });
  }
  const desc =
    opening.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    opening.excerpt;
  return pageMetadata({
    title: opening.title,
    description: desc,
    path: careerDetailHref(opening),
  });
}

export default async function CareerJobPage({ params }: Props) {
  const { slug } = await params;
  const opening = await getCareerOpening(slug);
  if (!opening) notFound();

  // Old bookmarks used /career/{cuid} — send them to the SEO slug.
  if (slug !== opening.slug) {
    permanentRedirect(careerDetailHref(opening));
  }

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Careers", path: "/career" },
          { name: opening.title, path: careerDetailHref(opening) },
        ])}
      />
      <div className="career-page">
        <CareerJobDetail opening={opening} />
      </div>
    </SitePage>
  );
}
