/* Single source for the headcount figure. It appears in the hero stats, the
   metrics counter, the site meta description, and a dozen sentences of prose,
   so it is written once here — the count-up in Metrics.tsx parses the digits
   off it rather than hardcoding a target. */
const EMPLOYEE_COUNT = "900+";

/** The same figure without the "+", for prose like "an 800-person team". */
const EMPLOYEE_COUNT_PLAIN = EMPLOYEE_COUNT.replace("+", "");

export const companyContent = {
  name: "BALITECH",
  legalName: "Bali Tech Pvt. Ltd",
  tagline: "Together We Build Success.",
  missionTagline: "Empowering Your Vision, Shaping Tomorrow.",

  workforce: {
    count: EMPLOYEE_COUNT,
    label: "Employees",
    labelLong: "Employees Nationwide",
  },

  heroStats: [
    { value: EMPLOYEE_COUNT, label: "Employees" },
    { value: "24/5", label: "Operations" },
    { value: "2022", label: "Established" },
  ] as const,

  about: {
    label: "About BALITECH",
    title: "Operational Excellence & Professional Growth",
    description:
      "BALITECH is a rapidly growing BPO organization dedicated to operational excellence, employee development, and delivering high-quality client services. With a strong focus on professionalism, innovation, and performance, BALITECH continues to build a dynamic work environment that supports both business success and career growth.",
    historyLabel: "History",
    historyHeadline: `From 7 People to ${EMPLOYEE_COUNT} Professionals`,
    goalsLabel: "Goals",
    collageLabel: "About BALITECH",
    collageTitle: "Annual Trips",
    collageIntro:
      "Relive BALITECH annual trips — team adventures from 2025 and 2026.",
    collageSwipeLabel: "Culture Day and Prize Distribution",
    annualTrips: {
      trip2k25: {
        title: "Annual Trip 2k25",
        subtitle: "Team bonding beyond the floor",
        description:
          "Our 2025 annual trip brought the BALITECH family together for celebration, recognition, and unforgettable moments — rewarding dedication with experiences that strengthen culture and connection.",
        highlights: [
          "Team celebrations & recognition",
          "Shared memories across departments",
          "Culture that rewards performance",
        ],
      },
      trip2k26: {
        title: "Annual Trip 2k26",
        subtitle: "Growing stronger together",
        description:
          "The 2026 annual trip reflects BALITECH's continued growth — a larger team, bigger milestones, and the same commitment to people-first culture, leadership, and professional excellence.",
        highlights: [
          `${EMPLOYEE_COUNT} professionals, one BALITECH family`,
          "Leadership & top-performer highlights",
          "Momentum for the year ahead",
        ],
      },
      managementTrip: {
        title: "Management Trip",
        subtitle: "Leadership beyond the office",
        description:
          "BALITECH management trips bring our leaders together for strategy, bonding, and shared vision — strengthening the culture that drives performance across every campaign.",
        highlights: [
          "Leadership alignment & planning",
          "Team-building across management",
          "Vision for organizational growth",
        ],
      },
    },
    history: [
      "BALITECH was established in April 2022 with a vision, determination, and a small team of only 7 people. The company began with a single setup of 40 agents and gradually evolved through hard work, consistency, and continuous improvement.",
      "Despite early challenges, BALITECH remained focused on building strong teams, developing leadership, and creating a professional organizational structure. Through dedication and resilience, the company successfully expanded into a recognized and fast-growing BPO organization.",
      `Today, BALITECH proudly operates with ${EMPLOYEE_COUNT} employees and manages multiple successful international campaigns while continuing to expand its operations and workforce nationwide.`,
    ],
    showcaseLabel: "Inside BALITECH",
    showcaseHeadline: "Built for Performance. Designed for People.",
    showcaseIntro:
      "How BALITECH combines professional operations, team development, and scalable delivery at every stage of growth.",
    showcase: [
      {
        title: "Professional Work Environment",
        text: "Structured operations, modern facilities, and a culture focused on performance, accountability, and client delivery excellence.",
      },
      {
        title: "People-First Development",
        text: "Training, mentorship, and leadership pathways that help teams grow skills, confidence, and long-term careers within the organization.",
      },
      {
        title: "Scalable Operations",
        text: `From a 7-person founding team to ${EMPLOYEE_COUNT} professionals nationwide — built on consistency, compliance, and operational discipline.`,
      },
    ],
    /* Milestones drawn from the company history above. Confirm exact dates
       with management before adding more granular year-by-year claims. */
    timeline: [
      {
        period: "2022",
        title: "BALITECH is founded",
        text: "Established in April 2022 by a team of 7, operating a single setup of 40 agents.",
      },
      {
        period: "2023–2024",
        title: "Structure and leadership",
        text: "Focus shifts to building strong teams, developing leadership, and putting a professional organizational structure in place.",
      },
      {
        period: "2025",
        title: "International campaigns",
        text: "Operations expand across multiple international campaigns with dedicated management and quality assurance.",
      },
      {
        period: "2026",
        title: `${EMPLOYEE_COUNT} professionals`,
        text: "A recognized, fast-growing BPO organization running 24/5 operations from four offices in Rawalpindi and Islamabad.",
      },
    ],
  },

  vision: {
    label: "Vision",
    text: "To become the number one employer across the country and build the fastest-growing organization through innovation, professionalism, and excellence.",
  },

  mission: {
    label: "Mission",
    tagline: "Empowering Your Vision, Shaping Tomorrow.",
    text: "At BALITECH, we are committed to helping clients shape their future through innovative solutions, exceptional services, and operational excellence. Our mission is to create a professional and growth-oriented environment where businesses and employees can succeed together and achieve long-term success.",
  },

  goals: [
    "Build a strong and professional workplace culture",
    "Develop skilled and high-performing professionals",
    "Maintain operational excellence and compliance standards",
    "Expand ACA, Medicare, and Final Expense campaigns nationwide",
    "Create leadership and career growth opportunities",
    "Strengthen company hierarchy and operational structure",
    "Continue expansion through new projects and partnerships",
  ],

  goalsHierarchy: {
    root: {
      title: "BALITECH",
      subtitle: "Organizational Structure & Goals",
    },
    branches: [
      {
        id: "culture",
        title: "Culture & People",
        items: [
          { index: 1, text: "Build a strong and professional workplace culture" },
          { index: 2, text: "Develop skilled and high-performing professionals" },
          { index: 3, text: "Create leadership and career growth opportunities" },
        ],
      },
      {
        id: "operations",
        title: "Operational Excellence",
        items: [
          { index: 4, text: "Maintain operational excellence and compliance standards" },
          { index: 5, text: "Strengthen company hierarchy and operational structure" },
        ],
      },
      {
        id: "growth",
        title: "Growth & Expansion",
        items: [
          { index: 6, text: "Expand ACA, Medicare, and Final Expense campaigns nationwide" },
          { index: 7, text: "Continue expansion through new projects and partnerships" },
        ],
      },
    ],
  },

  achievements: {
    label: "Achievements",
    title: "Metrics Of Our Successful Achievements",
    watermark: "NUMBER",
    stats: [
      { value: EMPLOYEE_COUNT, label: "Employees Nationwide" },
      { value: "24/5", label: "Operational Services" },
      { value: "1000+", label: "Growth Vision Target" },
      { value: "Multi", label: "International Campaigns" },
    ],
    highlights: [
      `Successfully operating with ${EMPLOYEE_COUNT} employees`,
      "Managing multiple international campaigns",
      "Running 24/5 operational services",
      "Building strong employee retention and growth",
      "Offering competitive salary and commission structures",
      "Expanding toward a vision of 1,000+ employees",
      "Launching new projects and operational departments",
      "Developing a professional and performance-driven workplace culture",
    ],
  },

  programs: {
    label: "Currently Running Programs",
    title: "Our Strategic Campaigns That Deliver",
    subtitle:
      "Industry-specific campaigns managed and optimized by our expert teams. Click a campaign to apply.",
    location: "Rawalpindi Branch",
    defaultRequirements: [
      "Good communication skills",
      "Professional attitude and team collaboration",
    ],
    items: [
      { title: "ACA Campaign", icon: "shield", description: "Affordable Care Act enrollment and support campaigns." },
      { title: "Medical Billing", icon: "file-text", description: "Professional medical billing and claims processing services." },
      { title: "Medicare", icon: "heart-pulse", description: "Medicare enrollment and advisory campaign solutions." },
      { title: "Medical Alert", icon: "bell", description: "Medical alert device sales and verification campaigns." },
      { title: "Final Expense", icon: "briefcase", description: "Final expense insurance outreach and sales programs." },
      { title: "BDO Services", icon: "users", description: "Business development and operational support services." },
      { title: "B2B Campaigns", icon: "target", description: "Business-to-business lead generation and outreach." },
      { title: "Lead Generation", icon: "trending-up", description: "Targeted outbound campaigns that drive qualified leads." },
      { title: "Inbound Call Services", icon: "headphones", description: "Expert handling of inbound customer inquiries." },
      { title: "Outbound Call Services", icon: "phone", description: "Proactive outbound sales and verification campaigns." },
      { title: "Customer Support Services", icon: "clock", description: "Dedicated customer support with 24/5 availability." },
      { title: "Sales & Verification Campaigns", icon: "zap", description: "Revenue-focused sales and compliance verification teams." },
    ],
  },

  services: {
    label: "Business Solutions",
    title: "Outsourcing Services That Carry Real",
    highlight: "Operational Weight",
    subtitle:
      "Six delivery lines, each staffed by a dedicated team with its own supervisor, quality assurance, and reporting cadence.",
    cards: [
      {
        id: "customer-support",
        icon: "headphones",
        title: "Customer Support",
        description:
          "A dedicated support desk running on your hours, your process, and your response standards.",
      },
      {
        id: "inbound",
        icon: "phone-incoming",
        title: "Inbound & Outbound",
        description:
          "Trained agents answering your customers and dialer-driven teams reaching new ones.",
      },
      {
        id: "lead-generation",
        icon: "target",
        title: "Lead Generation",
        description:
          "Qualified pipeline built against your criteria so your closers stop prospecting.",
      },
      {
        id: "b2b-outreach",
        icon: "briefcase",
        title: "B2B Outreach",
        description:
          "Multi-touch outreach into named account lists with decision-maker identification.",
      },
      {
        id: "sales-verification",
        icon: "shield",
        title: "Sales & Verification",
        description:
          "Compliance-led verification calling with documented scripts and a full audit trail.",
      },
      {
        id: "medical-billing",
        icon: "clipboard",
        title: "Business Process Support",
        description:
          "Back-office capacity for medical billing, claims follow-up, and records accuracy.",
      },
    ],
  },

  /* ── Services page only: how delivery actually works ── */
  serviceDelivery: {
    label: "Delivery Model",
    title: "The Operating Layer Behind Every",
    highlight: "Campaign",
    subtitle:
      "What sits around your agents — the supervision, tooling, and reporting that keeps a campaign predictable.",
    pillars: [
      {
        icon: "shield",
        title: "Quality Assurance",
        text: "Call monitoring against a defined scorecard, with coaching sessions tied to the findings rather than to a calendar.",
        points: ["Sampled call reviews", "Scorecard-based feedback", "Escalation thresholds"],
      },
      {
        icon: "server",
        title: "Technology & Infrastructure",
        text: "Dialer, CRM, and telephony configured per campaign, with redundant connectivity and backup power across offices.",
        points: ["Dialer & CRM setup", "Redundant connectivity", "Backup power"],
      },
      {
        icon: "chart",
        title: "Reporting & Visibility",
        text: "Agreed metrics reported on an agreed cadence, so performance conversations start from shared numbers.",
        points: ["Daily volume reporting", "Performance dashboards", "Review cadence"],
      },
      {
        icon: "lock",
        title: "Security & Compliance",
        text: "Access controls, script adherence, and documented processes for campaigns operating under regulation.",
        points: ["Controlled floor access", "Script compliance", "Documented audit trail"],
      },
    ],
  },

  engagementModels: {
    label: "Engagement",
    title: "Three Ways To Structure The",
    highlight: "Team",
    subtitle:
      "Most clients start with one model and move between them as volume settles.",
    models: [
      {
        name: "Dedicated Team",
        summary: "Agents assigned only to your campaign.",
        bestFor: "Steady, ongoing volume that justifies a fixed team.",
        includes: [
          "Named agents and supervisor",
          "Campaign-specific training",
          "Full reporting cadence",
        ],
      },
      {
        name: "Campaign-Based",
        summary: "A team built for a defined push, then wound down.",
        bestFor: "Seasonal drives, product launches, and testing new markets.",
        includes: [
          "Scoped duration and targets",
          "Rapid ramp-up",
          "Post-campaign reporting",
        ],
        featured: true,
      },
      {
        name: "Overflow Support",
        summary: "Capacity that absorbs the volume you cannot.",
        bestFor: "In-house teams hitting their ceiling at peak times.",
        includes: [
          "Shared or flexed headcount",
          "Escalation to your team",
          "Coverage outside your hours",
        ],
      },
    ],
  },

  servicesFaq: {
    label: "Common Questions",
    title: "What Clients Ask Before They",
    highlight: "Start",
    items: [
      {
        q: "How quickly can a team go live?",
        a: "It depends on team size and how much campaign-specific training is needed. Discovery and process definition happen first, then agents complete onboarding before handling live volume — we will give you a dated plan during discovery rather than a generic estimate.",
      },
      {
        q: "What is the minimum team size?",
        a: "We structure around your campaign rather than a fixed package, so this is part of the discovery conversation. Smaller pilots are workable when the intent is to test a market before scaling.",
      },
      {
        q: "Who manages the agents day to day?",
        a: "BALITECH does. Every campaign has a named supervisor responsible for performance, attendance, and escalation, so you are not absorbing line-management overhead.",
      },
      {
        q: "What hours can you cover?",
        a: "Operations run 24/5 across our offices, which lets us align teams to US business hours and after-hours coverage. Weekend coverage is arranged where a campaign requires it.",
      },
      {
        q: "How is performance measured?",
        a: "Against metrics agreed with you at the start — typically volume, conversion or resolution rates, and quality scores. Those same metrics drive the reporting you receive.",
      },
      {
        q: "Can we speak to the team before committing?",
        a: "Yes. Client visits and calls with the proposed supervisor are normal parts of onboarding, and we would rather you meet the people who will run your campaign.",
      },
    ],
  },

  /* ── About page only ── */
  values: {
    label: "How We Operate",
    title: "The Standards We Hold",
    highlight: "Ourselves To",
    subtitle:
      "Six principles that decide how we hire, how we manage campaigns, and what we will not promise.",
    items: [
      {
        icon: "award",
        title: "Performance Over Promises",
        text: "Progression, bonuses, and campaign ownership are earned against measured results rather than tenure.",
      },
      {
        icon: "users",
        title: "People Are The Product",
        text: "In outsourcing the service is the person on the call, so training and retention are operational priorities, not perks.",
      },
      {
        icon: "shield",
        title: "Compliance Is Not Optional",
        text: "Regulated campaigns run to script and leave an audit trail. We decline work we cannot deliver compliantly.",
      },
      {
        icon: "eye",
        title: "Visible Operations",
        text: "Clients see the numbers we see. Reporting is designed to surface problems early rather than to look reassuring.",
      },
      {
        icon: "trending",
        title: "Build To Scale",
        text: `Structure, hierarchy, and process come before headcount, which is how a 7-person team became ${EMPLOYEE_COUNT} without losing control.`,
      },
      {
        icon: "handshake",
        title: "Honest Positioning",
        text: "We publish what we can substantiate. No invented client logos, no borrowed case studies, no inflated numbers.",
      },
    ],
  },

  /* ── Home page only: compact culture teaser ── */
  insideCompany: {
    label: "Inside BALITECH",
    title: "The Team Behind The",
    highlight: "Operation",
    subtitle: `${EMPLOYEE_COUNT} people across four offices, with a recognition culture that keeps experienced agents on the floor.`,
    highlights: [
      {
        value: EMPLOYEE_COUNT,
        label: "Professionals across Rawalpindi and Islamabad",
      },
      {
        value: "24/5",
        label: "Operational coverage aligned to US business hours",
      },
      {
        value: "2022",
        label: "Established, and profitable enough to keep expanding",
      },
    ],
    cta: { label: "Explore Life At BALITECH", href: "/join-us" },
  },

  homeContact: {
    label: "Business Inquiry",
    title: "Ready To Build Your Outsourcing",
    highlight: "Team",
    subtitle:
      "Tell us what you need to run and we will come back with a team structure, a timeline, and what it takes to launch.",
    assurances: [
      "A named operations contact, not a call queue",
      "A structure proposal before any commitment",
      "Direct answers on what we can and cannot deliver",
    ],
  },

  solutions: {
    label: "Our Solutions",
    title: "Outsourcing Services Built Around Your",
    highlight: "Operation",
    subtitle:
      "Each service runs as a dedicated team with its own management, quality assurance, and reporting.",
    items: [
      {
        id: "inbound",
        icon: "headphones",
        title: "Inbound Call Center Services",
        summary:
          "Trained agents answering your customers, following your process, on your brand.",
        forWho:
          "Businesses with steady inbound volume that needs consistent handling and coverage.",
        capabilities: [
          "Customer enquiry handling",
          "Order and account support",
          "Escalation routing to your team",
          "Call quality monitoring",
        ],
      },
      {
        id: "outbound",
        icon: "phone",
        title: "Outbound Call Center Services",
        summary:
          "Dialer-driven outbound teams for sales, follow-up, and campaign outreach.",
        forWho:
          "Companies running acquisition or retention campaigns that need consistent contact volume.",
        capabilities: [
          "Sales and acquisition calling",
          "Appointment setting",
          "Follow-up and retention calls",
          "Script testing and refinement",
        ],
      },
      {
        id: "customer-support",
        icon: "clock",
        title: "Customer Support Outsourcing",
        summary:
          "A dedicated support desk operating on your hours with defined response standards.",
        forWho:
          "Businesses that need reliable support coverage without building an in-house desk.",
        capabilities: [
          "24/5 operational coverage",
          "Multi-channel handling",
          "Process and knowledge base adherence",
          "Performance reporting",
        ],
      },
      {
        id: "lead-generation",
        icon: "target",
        title: "Lead Generation Services",
        summary:
          "Qualified pipeline built by agents trained on your qualification criteria.",
        forWho:
          "Sales teams that want to spend their time closing rather than prospecting.",
        capabilities: [
          "Prospect research and list building",
          "Qualification against your criteria",
          "Warm transfer or scheduled handover",
          "Conversion tracking",
        ],
      },
      {
        id: "sales-verification",
        icon: "shield",
        title: "Sales & Verification",
        summary:
          "Verification and compliance calling for regulated sales processes.",
        forWho:
          "Insurance and regulated industries requiring documented verification steps.",
        capabilities: [
          "Sales verification calling",
          "Compliance script adherence",
          "Documentation and audit trail",
          "Quality review process",
        ],
      },
      {
        id: "medical-billing",
        icon: "clipboard",
        title: "Medical Billing Support",
        summary:
          "Back-office billing support handled by teams trained on healthcare workflows.",
        forWho:
          "US healthcare providers and billing companies needing added processing capacity.",
        capabilities: [
          "Claims processing support",
          "Eligibility and benefits verification",
          "Follow-up on outstanding claims",
          "Records accuracy checks",
        ],
      },
      {
        id: "b2b-outreach",
        icon: "briefcase",
        title: "B2B Outreach Services",
        summary:
          "Business-to-business outreach teams working named account lists.",
        forWho:
          "B2B companies selling into defined industries or account lists.",
        capabilities: [
          "Decision-maker identification",
          "Multi-touch outreach sequences",
          "Meeting booking",
          "Pipeline reporting",
        ],
      },
    ],
  },

  excellence: {
    label: "Excellence",
    title: "A Performance-Driven Organization With",
    highlight: "Proven Results",
    features: [
      {
        num: "01",
        title: "Professional Workplace Culture",
        description: "A strong, performance-driven environment built on professionalism and teamwork.",
      },
      {
        num: "02",
        title: "Skilled Professionals",
        description: `${EMPLOYEE_COUNT} trained agents developing into high-performing leaders nationwide.`,
      },
      {
        num: "03",
        title: "Operational Excellence",
        description: "Rigorous compliance standards and quality assurance across every campaign.",
      },
      {
        num: "04",
        title: "Career Growth Opportunities",
        description: "Leadership pathways and competitive salary structures for every team member.",
      },
      {
        num: "05",
        title: "Nationwide Expansion",
        description: "Growing ACA, Medicare, and Final Expense campaigns across the country.",
      },
      {
        num: "06",
        title: "Innovation & Partnerships",
        description: "Continuous expansion through new projects, departments, and strategic partnerships.",
      },
    ],
  },

  ceo: {
    name: "Sheraz Bali",
    title: "Chief Executive Officer",
    shortTitle: "CEO",
    company: "BALITECH",
    image: "/ceo-muhammad-shiraz-bali.png",
    label: "CEO Words",
    sectionTitle: "Leadership That Builds People",
    quoteGroups: [
      {
        lines: [
          "From vision to reality, BALITECH continues to grow through dedication, leadership, and teamwork.",
          "Success is achieved when vision, hard work, and leadership move together.",
        ],
      },
      {
        lines: [
          "We don't just create jobs; we create opportunities, leaders, and futures.",
          "BALITECH was built on struggle, driven by vision, and powered by people.",
          "Our goal is not only growth in numbers, but growth in professionalism, culture, and success.",
        ],
      },
      {
        lines: [
          "Together, we are building one of the fastest-growing organizations in the industry.",
          "Dream big, lead stronger, and grow together — that is the BALITECH vision.",
        ],
      },
    ],
  },

  footer: {
    description:
      "BALITECH — a rapidly growing BPO organization delivering high-quality client services, operational excellence, and career growth opportunities nationwide.",
    socialBranches: [
      {
        title: "Iran Road Branch",
        links: [
          {
            platform: "instagram",
            href: "https://www.instagram.com/balitech.iran.rd/",
            label: "Iran Road Branch on Instagram",
          },
          {
            platform: "facebook",
            href: "https://www.facebook.com/people/Balitech-Iran-Rd/61569259733646/",
            label: "Iran Road Branch on Facebook",
          },
          {
            platform: "tiktok",
            href: "",
            label: "Iran Road Branch on TikTok",
          },
        ],
      },
      {
        title: "I-9/3 Branch",
        links: [
          {
            platform: "instagram",
            href: "https://www.instagram.com/balitechi9/",
            label: "I-9/3 Branch on Instagram",
          },
          {
            platform: "facebook",
            href: "https://www.facebook.com/p/Bali-Tech-I-9-61593950835202/",
            label: "I-9/3 Branch on Facebook",
          },
          {
            platform: "tiktok",
            href: "",
            label: "I-9/3 Branch on TikTok",
          },
        ],
      },
      {
        title: "Commercial Branch",
        links: [
          {
            platform: "instagram",
            href: "https://www.instagram.com/balitech.commercial/",
            label: "Commercial Branch on Instagram",
          },
          {
            platform: "facebook",
            href: "https://www.facebook.com/balitech.commercial/",
            label: "Commercial Branch on Facebook",
          },
          {
            platform: "tiktok",
            href: "https://www.tiktok.com/@balitech.commercial",
            label: "Commercial Branch on TikTok",
          },
        ],
      },
      {
        title: "Shamsabad Branch",
        links: [
          {
            platform: "instagram",
            href: "https://www.instagram.com/balitechpvt.ltd/",
            label: "Shamsabad Branch on Instagram",
          },
          {
            platform: "facebook",
            href: "https://www.facebook.com/Balitechpvt.ltd",
            label: "Shamsabad Branch on Facebook",
          },
          {
            platform: "tiktok",
            href: "https://www.tiktok.com/@balitech.pvt.ltd",
            label: "Shamsabad Branch on TikTok",
          },
        ],
      },
    ],
    contact: {
      email: "hr@balitech.org",
      emails: [
        { label: "Business inquiries", address: "info@balitech.org" },
        { label: "Careers", address: "hr@balitech.org" },
      ],
    },
    phones: [
      { label: "0370 0585660", href: "tel:+923700585660" },
      { label: "0327 1233435", href: "tel:+923271233435" },
    ],
    locations: [
      {
        name: "Shamsabad Office",
        address:
          "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
      },
      {
        name: "Islamabad Office",
        address: "Plot No.349-352 street No 1 industrial Area 1-9/3, Islamabad",
      },
      {
        name: "Commercial Office",
        address:
          "Office No 1, 3rd Floor, Satellite Town B Block, Ideas Building Plaza Rwp",
      },
      {
        name: "Iran Road Office",
        address:
          "Plaza No A-74, Iran Road Satellite Town-A Rawalpindi Punjab Pakistan",
      },
    ],
  },

  hero: {
    titleLine1: "Outsourcing Built To",
    titleLine2: "Scale Your Business",
    subtitle:
      "BALITECH provides professional inbound, outbound, lead generation, customer support, and business process outsourcing solutions through trained teams and performance-driven operations.",
    tagline: "Together We Build Success.",
    trustLine: [
      `${EMPLOYEE_COUNT} Professionals`,
      "24/5 Operations",
      "Established 2022",
    ],
    primaryCta: { label: "Talk To Our Team", href: "/#contact" },
    secondaryCta: { label: "Explore Our Services", href: "/services" },
    careerLink: {
      label: "Looking for a career at BALITECH?",
      href: "/join-us",
    },
    /* The strip under the hero. Back office has no page of its own yet. */
    services: [
      { label: "Inbound Support", href: "/services/inbound" },
      { label: "Outbound Campaigns", href: "/services/outbound" },
      { label: "Lead Generation", href: "/services/lead-generation" },
      { label: "Customer Support", href: "/services/customer-support" },
      { label: "Back Office Operations", href: "/services" },
    ],
    /* Cards floating over the hero footage. `metric` renders the value large,
       `feature` keeps it at heading size so longer labels still fit. */
    highlights: [
      {
        type: "metric",
        value: EMPLOYEE_COUNT,
        label: "Active professionals",
      },
      { type: "metric", value: "24/5", label: "Operations coverage" },
      {
        type: "feature",
        value: "Quality Assurance",
        label: "Call monitoring and reviews",
      },
      {
        type: "feature",
        value: "Scalable Teams",
        label: "Headcount grows with volume",
      },
    ] as ReadonlyArray<{
      type: "metric" | "feature";
      value: string;
      label: string;
    }>,
  },

  /* Two clear entry points so client prospects and job seekers stop competing
     for the same space on the home page. */
  audiencePaths: {
    label: "Where Would You Like To Start",
    title: "Two Ways To Work With BALITECH",
    paths: [
      {
        id: "business",
        eyebrow: "For Businesses",
        title: "Scale With BALITECH",
        description:
          "Outsourcing, customer support, lead generation, and full BPO teams managed against your performance targets.",
        bullets: [
          "Inbound & outbound call operations",
          "Dedicated teams with QA and reporting",
          "Scale headcount as campaigns grow",
        ],
        cta: { label: "Explore Solutions", href: "/services" },
      },
      {
        id: "careers",
        eyebrow: "For Professionals",
        title: "Build Your Career At BALITECH",
        description: `Explore open positions, training pathways, employee benefits, and the culture behind our ${EMPLOYEE_COUNT_PLAIN}-person team.`,
        bullets: [
          "Freshers and experienced agents welcome",
          "Performance-based promotion structure",
          "Offices in Rawalpindi and Islamabad",
        ],
        cta: { label: "Explore Careers", href: "/join-us" },
      },
    ],
  },

  whyUs: {
    label: "Why BALITECH",
    title: "Why Companies Choose",
    highlight: "BALITECH",
    subtitle:
      "Operational capability, not promises. Here is what a client actually gets when they hand a campaign to our teams.",
    items: [
      {
        num: "01",
        icon: "users",
        title: "Trained Teams",
        description:
          "Structured onboarding, campaign-specific coaching, and continuous performance development for every agent.",
      },
      {
        num: "02",
        icon: "target",
        title: "Dedicated Management",
        description:
          "Clear operational ownership with named team leads and defined escalation channels for your campaign.",
      },
      {
        num: "03",
        icon: "shield",
        title: "Quality Assurance",
        description:
          "Defined QA processes, call monitoring, and regular performance reviews against agreed standards.",
      },
      {
        num: "04",
        icon: "trending",
        title: "Scalable Operations",
        description:
          "Add trained headcount as campaign requirements increase, drawing on a nationwide recruitment pipeline.",
      },
      {
        num: "05",
        icon: "chart",
        title: "Reporting & Visibility",
        description:
          "Operational performance reporting so you always know how the team is tracking against targets.",
      },
      {
        num: "06",
        icon: "settings",
        title: "Flexible Engagement",
        description:
          "Engagement models structured around your campaign requirements rather than a fixed package.",
      },
    ],
  },

  howWeWork: {
    label: "How We Work",
    title: "From First Call To A Running",
    highlight: "Team",
    subtitle:
      "A predictable onboarding path so you know exactly what happens between signing and going live.",
    steps: [
      {
        num: "01",
        title: "Discover",
        description:
          "We map your campaign goals, target audience, compliance requirements, and success metrics.",
      },
      {
        num: "02",
        title: "Build",
        description:
          "We assemble the right team structure, define scripts and processes, and set up reporting.",
      },
      {
        num: "03",
        title: "Train",
        description:
          "Agents complete campaign-specific onboarding and product training before handling live volume.",
      },
      {
        num: "04",
        title: "Launch",
        description:
          "The team goes live with supervisor oversight and daily monitoring through the ramp-up period.",
      },
      {
        num: "05",
        title: "Optimize",
        description:
          "QA reviews, coaching, and reporting cycles refine performance as the campaign matures.",
      },
    ],
  },

  /* Client proof. Keep these arrays empty until BALITECH has written client
     approval — the sections skip rendering rather than show invented numbers. */
  proof: {
    caseStudies: {
      label: "Results",
      title: "Work We Have Delivered",
      subtitle:
        "Documented campaign outcomes from BALITECH operations teams.",
      items: [] as ReadonlyArray<{
        client: string;
        industry: string;
        challenge: string;
        solution: string;
        results: ReadonlyArray<{ value: string; label: string }>;
      }>,
    },
    testimonials: {
      label: "Client Feedback",
      title: "Trusted By Businesses That Demand",
      highlight: "Performance",
      items: [] as ReadonlyArray<{
        quote: string;
        name: string;
        position: string;
        company: string;
      }>,
    },
  },

  career: {
    titleLine: "Step Into A Growth-Driven",
    titleHighlight: "Career Opportunity",
    description:
      "Your next career opportunity is here! Explore openings, showcase your talent, and take the first step toward a fulfilling career with BALITECH.",
    cta: "Apply Now",
    salary:
      "Salary: Competitive, based on experience and interview performance.",
  },

  joinUs: {
    hero: {
      eyebrow: "Careers at BALITECH",
      titleLine: "Become A Part Of",
      titleHighlight: "Our Growth",
      subtitle:
        "Explore openings, showcase your talent, and take the first step toward a fulfilling career with one of Pakistan's fastest-growing BPO organizations.",
    },
    form: {
      title: "Apply Now To Join Our Team",
      subtitle:
        "Submit your details below, and we'll get back to you shortly regarding your inquiry or concern.",
      experienceOptions: [
        { value: "", label: "Do you have previous experience in the BPO industry?" },
        { value: "yes", label: "Yes, I have BPO experience" },
        { value: "no", label: "No, I'm a fresher" },
      ],
      branches: [
        { value: "", label: "Select a branch" },
        {
          value: "shamsabad-office",
          label: "Shamsabad Office",
        },
        {
          value: "islamabad-office",
          label: "Islamabad Office",
        },
        {
          value: "commercial-office",
          label: "Commercial Office",
        },
        {
          value: "iran-road-office",
          label: "Iran Road Office",
        },
      ],
      positions: [
        { value: "", label: "Position you're applying for" },
        { value: "csr", label: "Customer Service Representative (CSR)" },
        { value: "sales", label: "Sales Agent" },
        { value: "lead-gen", label: "Lead Generation Agent" },
        { value: "support", label: "Customer Support Specialist" },
        { value: "team-lead", label: "Team Lead" },
      ],
      positionPlaceholderNoBranch: "Choose a branch first",
      messagePlaceholder: "Any additional message...",
    },
    openings: {
      label: "Open Positions",
      title: "Current Job Openings",
      jobs: [
        {
          id: "csr-rawalpindi",
          title: "CSR",
          role: "Customer Service Representative",
          location: "Rawalpindi Branch",
          bullets: ["Freshers can apply", "Good communication skills"],
        },
        {
          id: "csr-islamabad",
          title: "CSR",
          role: "Customer Service Representative",
          location: "Islamabad Branch",
          bullets: ["Freshers can apply", "Professional attitude required"],
        },
        {
          id: "sales-rawalpindi",
          title: "Sales Agent",
          role: "Outbound Sales & Verification",
          location: "Rawalpindi Branch",
          bullets: ["Experience preferred", "Strong communication skills"],
        },
      ],
    },
    appointment: {
      title: "Let's Meet With Us — Make An Appointment First",
      address:
        "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=Office%208%2C%20Maryam%20Business%20Centre%2C%20Murree%20Road%2C%20Shamsabad%2C%20Rawalpindi%2C%20Punjab%204400&hl=en&z=14&output=embed",
      mapTitle: "Maryam Business Centre location map",
    },
    contact: {
      hoursLabel: "Shift Hours",
      hours: "Monday–Friday · 6:00 PM – 4:00 AM",
      emailLabel: "HR Email",
      email: "hr@balitech.org",
      phoneLabel: "Phone",
      phone: "0370 0585660",
      phoneHref: "tel:+923700585660",
      phoneSecondary: "0327 1233435",
      phoneSecondaryHref: "tel:+923271233435",
    },
    benefits: {
      label: "Why Join Us",
      title: "Grow With A Performance-Driven Team",
      items: [
        { num: "01", title: "Daily, Weekly & Monthly Bonuses" },
        { num: "02", title: "Skill Development Initiatives" },
        { num: "03", title: "Collaborative Culture" },
        { num: "04", title: "Performance-Based Promotion" },
        { num: "05", title: "Dynamic Work Environment" },
        { num: "06", title: "Inclusive Environment" },
      ],
    },
  },
} as const;
