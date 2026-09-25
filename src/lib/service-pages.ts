import { companyContent } from "@/lib/content";

type Solution = (typeof companyContent.solutions.items)[number];

export type ServicePage = {
  slug: string;
  /** Page title; the layout template appends the company name. */
  metaTitle: string;
  /** Kept under ~155 characters so Google shows it in full. */
  metaDescription: string;
  heading: string;
  intro: string[];
  benefits: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  relatedBlogs: string[];
  related: string[];
};

/**
 * One landing page per service line, each written around a specific,
 * lower-competition search phrase rather than the broad "BPO services".
 * Short sentences on purpose: most readers are prospective clients for whom
 * English is a second language.
 */
const PAGES: ServicePage[] = [
  {
    slug: "inbound",
    metaTitle: "Inbound Call Center Services in Pakistan",
    metaDescription:
      "Inbound call center services from Rawalpindi and Islamabad. Trained BALITECH agents answer your customers on your process, your brand and US hours.",
    heading: "Inbound Call Center Services in Pakistan",
    intro: [
      "Every call your customers make should be answered by someone who knows your process. BALITECH runs dedicated inbound teams from our offices in Rawalpindi and Islamabad.",
      "Agents are trained on your scripts, systems and escalation rules before they take a live call. A named supervisor manages the team, and you see the same numbers we do.",
    ],
    benefits: [
      { title: "Coverage on US hours", text: "Teams work 24/5 shifts aligned to US business hours, with after-hours cover when you need it." },
      { title: "Your process, not ours", text: "We follow your call flows, knowledge base and escalation paths so customers get one consistent experience." },
      { title: "Quality you can check", text: "Calls are monitored and scored against criteria agreed with you, and the scores are shared in your reports." },
    ],
    faqs: [
      { q: "What kinds of inbound calls do you handle?", a: "Customer enquiries, order and account support, and routing escalations to your in-house team. We scope the exact call types during discovery." },
      { q: "Can inbound agents use our CRM?", a: "Yes. Agents are trained on your CRM and ticketing tools during onboarding, before they handle live volume." },
      { q: "How do you measure inbound performance?", a: "Against metrics agreed at the start, usually answer rates, handling time, resolution rate and quality scores." },
    ],
    relatedBlogs: ["high-performing-call-center-team", "outsourcing-to-pakistan"],
    related: ["customer-support", "outbound", "sales-verification"],
  },
  {
    slug: "outbound",
    metaTitle: "Outbound Call Center in Rawalpindi",
    metaDescription:
      "Outbound call center teams in Rawalpindi and Islamabad for sales, appointment setting and follow-up campaigns, managed by BALITECH to your targets.",
    heading: "Outbound Call Center Services in Rawalpindi",
    intro: [
      "Outbound campaigns live or die on consistent contact volume. BALITECH runs dialer-driven outbound teams for sales, appointment setting and follow-up calling.",
      "We recruit, train and manage the agents in Rawalpindi and Islamabad. You agree the targets, and we report against them every day.",
    ],
    benefits: [
      { title: "Dialer and CRM ready", text: "Dialer, CRM and telephony are configured per campaign, with backup connectivity and power across our offices." },
      { title: "Scripts that improve", text: "We test script changes against conversion and share what works, instead of reading one script for months." },
      { title: "Compliance first", text: "Regulated campaigns run to script with an audit trail. We decline work we cannot deliver compliantly." },
    ],
    faqs: [
      { q: "Which outbound campaigns do you run?", a: "Sales and acquisition calling, appointment setting, and follow-up or retention calls, mainly for US markets." },
      { q: "Do you provide the dialer?", a: "We can run on our dialer setup or on yours. The choice is made during discovery, based on your reporting needs." },
      { q: "Can we start with a small pilot?", a: "Yes. A smaller pilot is workable when you want to test a market or a script before scaling the team." },
    ],
    relatedBlogs: ["scales-us-campaign-operations", "high-performing-call-center-team"],
    related: ["lead-generation", "sales-verification", "b2b-outreach"],
  },
  {
    slug: "customer-support",
    metaTitle: "Customer Support Outsourcing to Pakistan",
    metaDescription:
      "Outsource customer support to a dedicated BALITECH desk in Pakistan. 24/5 coverage, multi-channel handling and clear response standards.",
    heading: "Customer Support Outsourcing",
    intro: [
      "Building an in-house support desk takes hiring, training and management time. BALITECH gives you a dedicated support team that works on your hours and to your standards.",
      "Your team handles calls and other channels using your knowledge base. Response standards are agreed up front and reported on regularly.",
    ],
    benefits: [
      { title: "24/5 operations", text: "Support teams run 24/5 across our offices, so your customers are covered during US business hours and beyond." },
      { title: "Multi-channel handling", text: "Phone and written channels can be handled by the same trained team, following one process." },
      { title: "Managed for you", text: "BALITECH supervises attendance, performance and escalation, so you are not taking on line management." },
    ],
    faqs: [
      { q: "Is the support team dedicated to us?", a: "Yes. Each client gets a dedicated team with its own supervisor, rather than shared agents across accounts." },
      { q: "What hours can support cover?", a: "Operations run 24/5. Weekend cover can be arranged when a campaign needs it." },
      { q: "How are support standards agreed?", a: "We define response and resolution targets with you during discovery, then report against them." },
    ],
    relatedBlogs: ["outsourcing-to-pakistan", "high-performing-call-center-team"],
    related: ["inbound", "medical-billing", "outbound"],
  },
  {
    slug: "lead-generation",
    metaTitle: "Lead Generation Call Center Services",
    metaDescription:
      "Lead generation call center services from Pakistan. BALITECH agents qualify prospects on your criteria and hand over warm leads to your sales team.",
    heading: "Lead Generation Call Center Services",
    intro: [
      "Your sales team should spend its time closing, not prospecting. BALITECH builds a qualified pipeline with agents trained on your qualification criteria.",
      "Leads are handed over by warm transfer or scheduled appointment, and we track what converts so the criteria keep improving.",
    ],
    benefits: [
      { title: "Qualified, not just contacted", text: "Agents qualify every lead against the criteria you define, so your closers only speak to real prospects." },
      { title: "Flexible handover", text: "Choose warm transfers to your team or booked appointments in their calendars." },
      { title: "Conversion tracking", text: "We track which leads turn into sales and use that to refine targeting and scripts." },
    ],
    faqs: [
      { q: "Do you build the prospect lists?", a: "We can research and build lists, or work from data you provide. Both are covered in the campaign setup." },
      { q: "How is a lead qualified?", a: "Against criteria agreed with you, such as budget, need and timing. Only leads that meet them are handed over." },
      { q: "Which markets do you generate leads in?", a: "Our teams mainly serve US campaigns, calling on US business hours from Rawalpindi and Islamabad." },
    ],
    relatedBlogs: ["scales-us-campaign-operations", "outsourcing-to-pakistan"],
    related: ["outbound", "b2b-outreach", "sales-verification"],
  },
  {
    slug: "sales-verification",
    metaTitle: "Sales Verification Call Center Services",
    metaDescription:
      "Sales verification and compliance calling for insurance and regulated sales, with documented scripts and a full audit trail from BALITECH.",
    heading: "Sales Verification Services",
    intro: [
      "Regulated sales need documented verification steps. BALITECH runs verification and compliance calling for insurance and other regulated industries.",
      "Every call follows an approved script and leaves an audit trail. Quality reviewers check calls before issues can reach your compliance team.",
    ],
    benefits: [
      { title: "Script adherence", text: "Verifiers follow compliance scripts word for word, and deviations are caught in quality review." },
      { title: "Audit trail", text: "Calls and outcomes are documented so each verified sale can be traced and checked." },
      { title: "Experienced verifiers", text: "Our teams include verifiers from ACA, Medicare and final expense campaigns." },
    ],
    faqs: [
      { q: "Which industries need sales verification?", a: "Mostly insurance, including ACA, Medicare and final expense, plus other regulated sales that require third-party verification." },
      { q: "How do you keep verification compliant?", a: "Approved scripts, call recording, documentation of each outcome and a separate quality review process." },
      { q: "Can verifiers work alongside our closers?", a: "Yes. Verification can run as a separate step after your sales team or ours closes the call." },
    ],
    relatedBlogs: ["scales-us-campaign-operations", "high-performing-call-center-team"],
    related: ["outbound", "inbound", "lead-generation"],
  },
  {
    slug: "medical-billing",
    metaTitle: "Medical Billing Outsourcing in Pakistan",
    metaDescription:
      "Medical billing outsourcing from Pakistan for US providers: claims support, eligibility checks and claim follow-up by BALITECH's trained teams.",
    heading: "Medical Billing Outsourcing in Pakistan",
    intro: [
      "US healthcare providers and billing companies often need more processing capacity than they can hire locally. BALITECH provides back-office medical billing support from Pakistan.",
      "Teams are trained on healthcare billing workflows and work inside your systems, with accuracy checks built into the process.",
    ],
    benefits: [
      { title: "Added capacity", text: "Scale billing capacity up without recruiting and training an in-house team yourself." },
      { title: "Eligibility and follow-up", text: "Eligibility and benefits checks and follow-up on outstanding claims help reduce delays." },
      { title: "Accuracy checks", text: "Records are checked for accuracy as part of the workflow, not as an afterthought." },
    ],
    faqs: [
      { q: "What medical billing tasks do you support?", a: "Claims processing support, eligibility and benefits verification, follow-up on outstanding claims and records accuracy checks." },
      { q: "Who is medical billing outsourcing for?", a: "US healthcare providers and billing companies that need extra processing capacity." },
      { q: "Do your teams work in our billing software?", a: "Yes. Agents are trained on your systems and workflows during onboarding." },
    ],
    relatedBlogs: ["outsourcing-to-pakistan", "scales-us-campaign-operations"],
    related: ["customer-support", "inbound", "sales-verification"],
  },
  {
    slug: "b2b-outreach",
    metaTitle: "B2B Outreach & Appointment Setting",
    metaDescription:
      "B2B outreach teams that find decision-makers, run multi-touch sequences and book meetings for your sales team. Managed by BALITECH in Pakistan.",
    heading: "B2B Outreach Services",
    intro: [
      "Selling to businesses means reaching the right person inside the right account. BALITECH runs B2B outreach teams that work your named account lists.",
      "Agents identify decision-makers, run multi-touch outreach and book meetings, and you get pipeline reporting on every account.",
    ],
    benefits: [
      { title: "Decision-maker focus", text: "Research comes first, so outreach reaches the people who can actually buy." },
      { title: "Multi-touch sequences", text: "Structured follow-up across several touches instead of a single cold call." },
      { title: "Meetings on your calendar", text: "Qualified meetings are booked directly for your sales team, with notes on each account." },
    ],
    faqs: [
      { q: "Do you work from our account list?", a: "Yes. We work named account lists you provide, and can help research contacts within them." },
      { q: "What does a B2B outreach team deliver?", a: "Identified decision-makers, completed outreach sequences, booked meetings and pipeline reporting." },
      { q: "How is B2B outreach different from lead generation?", a: "B2B outreach targets defined accounts and books meetings with named people. Lead generation qualifies a wider pool of prospects." },
    ],
    relatedBlogs: ["scales-us-campaign-operations", "outsourcing-to-pakistan"],
    related: ["lead-generation", "outbound", "customer-support"],
  },
];

export const servicePages = PAGES;

export function getServicePage(slug: string) {
  return PAGES.find((page) => page.slug === slug) ?? null;
}

export function getSolution(slug: string): Solution | null {
  return companyContent.solutions.items.find((item) => item.id === slug) ?? null;
}

export function serviceHref(slug: string) {
  return `/services/${slug}`;
}
