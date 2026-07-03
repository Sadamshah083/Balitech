import SitePage from "@/components/layout/SitePage";
import JoinUsHero from "@/components/join-us/JoinUsHero";
import JoinUsApplicationForm from "@/components/join-us/JoinUsApplicationForm";
import JoinUsOpenings from "@/components/join-us/JoinUsOpenings";
import JoinUsContact from "@/components/join-us/JoinUsContact";
import JoinUsBenefits from "@/components/join-us/JoinUsBenefits";
import { getHeadOffice } from "@/lib/offices";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Join Us — Careers & Job Openings",
  description:
    "Apply to join BALITECH. Call center, customer support, and BPO careers in Rawalpindi & Islamabad. Competitive salary, career growth, and a professional workplace culture.",
  path: "/join-us",
  keywords: [
    "Bali Tech careers",
    "BPO jobs Rawalpindi",
    "call center jobs Islamabad",
    "customer support jobs Pakistan",
    "night shift jobs",
    "apply BALITECH",
    "BPO hiring Pakistan",
  ],
});

export default async function JoinUsPage() {
  const headOffice = await getHeadOffice();

  return (
    <SitePage>
      <div className="join-us-page">
        <JoinUsHero />
        <JoinUsApplicationForm />
        <JoinUsOpenings />
        <JoinUsContact headOffice={headOffice} />
        <JoinUsBenefits />
      </div>
    </SitePage>
  );
}
