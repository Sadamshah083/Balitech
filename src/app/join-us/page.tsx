import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import JoinUsHero from "@/components/join-us/JoinUsHero";
import JoinUsApplicationForm from "@/components/join-us/JoinUsApplicationForm";
import JoinUsOpenings from "@/components/join-us/JoinUsOpenings";
import JoinUsContact from "@/components/join-us/JoinUsContact";
import JoinUsBenefits from "@/components/join-us/JoinUsBenefits";
import { getHeadOffice } from "@/lib/offices";

export const metadata: Metadata = {
  title: "Apply Now | BALITECH",
  description:
    "Apply to join BALITECH — competitive salary, career growth, and a professional BPO workplace culture.",
};

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
