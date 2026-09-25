import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import ContactForm from "@/components/landing/ContactForm";
import JsonLd from "@/components/seo/JsonLd";
import { companyContent } from "@/lib/content";
import { getPublicBlogs } from "@/lib/blogs";
import { servicesBannerImage } from "@/lib/page-imagery";
import {
  getServicePage,
  getSolution,
  serviceHref,
  servicePages,
} from "@/lib/service-pages";
import {
  SITE_LEGAL_NAME,
  SITE_URL,
  breadcrumbSchema,
  faqSchema,
  pageMetadata,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: serviceHref(slug),
    image: servicesBannerImage,
  });
}

const STEPS = [
  { title: "Discovery", text: "We map your process, volumes, targets and compliance needs, then propose a team structure and a dated plan." },
  { title: "Recruitment and training", text: "We hire for the campaign and train agents on your scripts, systems and quality criteria before go-live." },
  { title: "Go-live", text: "The team starts on live volume with a named supervisor responsible for performance and escalation." },
  { title: "Reporting and improvement", text: "You get regular reports on the metrics we agreed, and we adjust scripts and staffing based on results." },
];

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getServicePage(slug);
  const solution = getSolution(slug);
  if (!page || !solution) notFound();

  const blogs = await getPublicBlogs();
  const relatedBlogs = page.relatedBlogs
    .map((blogSlug) => blogs.find((blog) => blog.slug === blogSlug))
    .filter((blog): blog is NonNullable<typeof blog> => Boolean(blog));
  const relatedServices = page.related.flatMap((relatedSlug) => {
    const relatedSolution = getSolution(relatedSlug);
    return relatedSolution ? [{ slug: relatedSlug, solution: relatedSolution }] : [];
  });

  const url = `${SITE_URL}${serviceHref(slug)}`;

  return (
    <SitePage>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Services", path: "/services" },
            { name: solution.title, path: serviceHref(slug) },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: solution.title,
            serviceType: solution.title,
            description: page.metaDescription,
            url,
            provider: { "@type": "Organization", name: SITE_LEGAL_NAME, url: SITE_URL },
            areaServed: [
              { "@type": "Country", name: "United States" },
              { "@type": "Country", name: "Pakistan" },
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `${solution.title} capabilities`,
              itemListElement: solution.capabilities.map((capability) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: capability },
              })),
            },
          },
          faqSchema(page.faqs),
        ]}
      />

      <PageBanner
        title={page.heading}
        subtitle={solution.summary}
        image={servicesBannerImage}
        compact
      />

      <nav aria-label="Breadcrumb" className="ent-shell pt-8 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-orange">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services" className="hover:text-orange">Services</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">{solution.title}</li>
        </ol>
      </nav>

      <section className="ent-section" aria-labelledby="service-overview-title">
        <div className="ent-shell grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <p className="ent-eyebrow">{companyContent.solutions.label}</p>
            <h2 id="service-overview-title" className="ent-title">
              How BALITECH runs <em>{solution.title.toLowerCase()}</em>
            </h2>
            {page.intro.map((paragraph) => (
              <p key={paragraph} className="ent-lede mt-5">{paragraph}</p>
            ))}
            <p className="mt-6 rounded-lg border border-foreground/10 bg-background/40 p-4 text-sm leading-relaxed text-foreground/80">
              <strong className="text-orange">Who it is for: </strong>
              {solution.forWho}
            </p>
          </div>

          <aside className="ent-card" aria-labelledby="service-capabilities-title">
            <h2 id="service-capabilities-title" className="ent-card__title">What the team handles</h2>
            <ul className="mt-4 space-y-2">
              {solution.capabilities.map((capability) => (
                <li key={capability} className="solutions-grid__bullet text-sm text-foreground/80">
                  {capability}
                </li>
              ))}
            </ul>
            <Link href="#contact" className="ent-btn mt-7">
              Discuss this service
              <ArrowRight size={16} aria-hidden />
            </Link>
          </aside>
        </div>
      </section>

      <section className="ent-section ent-section--lit" aria-labelledby="service-benefits-title">
        <div className="ent-shell">
          <header className="ent-head">
            <p className="ent-eyebrow">Why BALITECH</p>
            <h2 id="service-benefits-title" className="ent-title">
              What you get with <em>BALITECH</em>
            </h2>
          </header>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {page.benefits.map((benefit) => (
              <article key={benefit.title} className="ent-card">
                <h3 className="ent-card__title">{benefit.title}</h3>
                <p className="ent-card__text">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ent-section" aria-labelledby="service-steps-title">
        <div className="ent-shell">
          <header className="ent-head">
            <p className="ent-eyebrow">How it works</p>
            <h2 id="service-steps-title" className="ent-title">
              From first call to <em>live team</em>
            </h2>
          </header>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="ent-card">
                <span className="text-sm font-bold text-orange">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="ent-card__title">{step.title}</h3>
                <p className="ent-card__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ent-section ent-section--lit" aria-labelledby="service-faq-title">
        <div className="ent-shell max-w-4xl">
          <header className="ent-head">
            <p className="ent-eyebrow">Common questions</p>
            <h2 id="service-faq-title" className="ent-title">
              {solution.title} <em>FAQ</em>
            </h2>
          </header>
          <div className="mt-8 space-y-3">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="ent-card group">
                <summary className="cursor-pointer list-none font-semibold text-foreground">
                  {faq.q}
                </summary>
                <p className="ent-card__text mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ent-section" aria-labelledby="service-related-title">
        <div className="ent-shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="service-related-title" className="ent-title text-2xl">Related services</h2>
            <ul className="mt-5 space-y-3">
              {relatedServices.map((related) => (
                <li key={related.slug}>
                  <Link href={serviceHref(related.slug)} className="ent-link">
                    {related.solution.title}
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <p className="mt-1 text-sm text-muted">{related.solution.summary}</p>
                </li>
              ))}
              <li>
                <Link href="/services" className="ent-link">
                  All BPO and call center services
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </li>
            </ul>
          </div>
          {relatedBlogs.length > 0 && (
            <div>
              <h2 className="ent-title text-2xl">From our blog</h2>
              <ul className="mt-5 space-y-3">
                {relatedBlogs.map((blog) => (
                  <li key={blog.slug}>
                    <Link href={`/blog/${blog.slug}`} className="ent-link">
                      {blog.title}
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                    {blog.excerpt && <p className="mt-1 text-sm text-muted">{blog.excerpt}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <ContactForm />
    </SitePage>
  );
}
