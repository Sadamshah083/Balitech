import Link from "next/link";
import SitePage from "@/components/layout/SitePage";
import JsonLd from "@/components/seo/JsonLd";
import { companyContent } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How BALITECH collects, uses and protects the personal information you share through our website, contact forms and job applications.",
  path: "/privacy-policy",
});

const [businessEmail, careersEmail] = companyContent.footer.contact.emails;
const phone = companyContent.footer.phones[0];

const sections = [
  {
    title: "Information we collect",
    body: [
      "When you contact us through a business inquiry or contact form we collect your name, email address, phone number, company name and the details of your message.",
      "When you apply for a job we collect the information described in our Recruitment Privacy Notice, including your CV if you upload one.",
      "When you browse the site we collect standard technical data such as your browser type, device, pages visited and approximate location, through server logs and Google Analytics.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To respond to your inquiry, prepare proposals and deliver the services you ask for.",
      "To assess job applications and contact candidates about interviews and suitable openings.",
      "To understand how visitors use the website so we can improve its content, speed and security.",
      "We do not sell your personal information, and we do not use it for purposes unrelated to the reason you shared it.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We use Google Analytics to measure traffic and page performance. It sets cookies that record anonymous usage data such as pages viewed and time on site.",
      "You can block or delete cookies in your browser settings. The website will still work without them.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "Your information is only available to authorised BALITECH staff who need it to handle your inquiry or application.",
      "We use trusted service providers for hosting, email and analytics. They process data on our behalf and may not use it for their own purposes.",
      "We may disclose information where the law requires it.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "We keep inquiry and application records only for as long as they are needed for the purpose they were collected for, or as required by law, and then delete them.",
    ],
  },
  {
    title: "How we protect it",
    body: [
      "The website is served over HTTPS, access to our admin tools is restricted to authorised users, and uploaded CVs are stored privately and are never publicly accessible.",
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Privacy Policy", path: "/privacy-policy" }])}
      />
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-foreground/90 sm:px-6">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 leading-relaxed">
          This policy explains how {companyContent.legalName} (&ldquo;BALITECH&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses and protects personal
          information shared through this website.
        </p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mt-10 text-xl font-bold text-foreground">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <h2 className="mt-10 text-xl font-bold text-foreground">Job applicants</h2>
        <p className="mt-3 leading-relaxed">
          Details on how we handle applications and CVs are in our{" "}
          <Link href="/recruitment-privacy-notice" className="text-orange underline">
            Recruitment Privacy Notice
          </Link>
          .
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">Your rights and contact</h2>
        <p className="mt-3 leading-relaxed">
          You can ask to see, correct or delete the personal information we hold about
          you. For business inquiries email{" "}
          <a href={`mailto:${businessEmail.address}`} className="text-orange underline">
            {businessEmail.address}
          </a>
          , for job applications email{" "}
          <a href={`mailto:${careersEmail.address}`} className="text-orange underline">
            {careersEmail.address}
          </a>
          , or call{" "}
          <a href={phone.href} className="text-orange underline">
            {phone.label}
          </a>
          .
        </p>

        <p className="mt-10 text-sm text-muted">
          We may update this policy from time to time. The latest version is always
          published on this page.
        </p>
      </article>
    </SitePage>
  );
}
