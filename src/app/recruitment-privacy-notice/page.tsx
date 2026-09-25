import SitePage from "@/components/layout/SitePage";
import { companyContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Recruitment Privacy Notice",
  description:
    "How Balitech uses the information you provide when you apply for a role.",
  path: "/recruitment-privacy-notice",
});

const hrEmail = companyContent.joinUs.contact.email;

export default function RecruitmentPrivacyNoticePage() {
  return (
    <SitePage>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-foreground/90 sm:px-6">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Recruitment Privacy Notice
        </h1>
        <p className="mt-4 leading-relaxed">
          This notice explains how Balitech uses the information you provide when you apply for a
          role through our careers page.
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">What we collect</h2>
        <p className="mt-3 leading-relaxed">
          Your contact details, location, the role and branch you are interested in, your
          experience, qualifications, availability, salary expectation, any CV you upload, and
          your other answers on the application form. We also record how you found the vacancy and
          when you applied.
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">How we use it</h2>
        <p className="mt-3 leading-relaxed">
          We use your application to assess your suitability for the role you applied for, to
          contact you about this application, and to arrange interviews. If you ticked the option
          to be considered for future openings, we may also contact you about other suitable
          roles.
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">Who can see it</h2>
        <p className="mt-3 leading-relaxed">
          Your application is shared with the recruitment teams at the relevant Balitech branches.
          Access to applications and CVs is limited to authorised staff. If you have worked for
          Balitech before, HR may check your previous employment record across branches.
        </p>

        <h2 className="mt-10 text-xl font-bold text-foreground">Your choices</h2>
        <p className="mt-3 leading-relaxed">
          You can ask us to see, correct or delete your application, or withdraw it, by emailing{" "}
          <a href={`mailto:${hrEmail}`} className="text-orange underline">
            {hrEmail}
          </a>{" "}
          and quoting your application reference number.
        </p>
      </article>
    </SitePage>
  );
}
