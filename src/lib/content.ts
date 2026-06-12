const EMPLOYEE_COUNT = "500+";

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
    collageSwipeLabel: " Culture Day and Prize Distribution",
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
    label: "Our Services",
    title: "Professional Outsourcing Solutions",
    cards: [
      {
        title: "Inbound & Outbound",
        description:
          "Expert inbound call services and proactive outbound campaigns tailored to your business goals.",
      },
      {
        title: "Lead Generation",
        description:
          "Targeted B2B and sales campaigns that drive qualified leads and measurable conversions.",
      },
      {
        title: "Customer Support",
        description:
          "Dedicated customer support services with 24/5 operational coverage and trained professionals.",
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
    name: "Muhammad Shiraz Bali",
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
  },

  hero: {
    label: "BALITECH",
    titleLine1: "Empowering Your Vision,",
    titleLine2: "Shaping Tomorrow",
    subtitle:
      "At BALITECH, we are committed to helping clients shape their future through innovative solutions, exceptional services, and operational excellence. Our mission is to create a professional and growth-oriented environment where businesses and employees can succeed together and achieve long-term success.",
    tagline: "Together We Build Success.",
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
      titleHighlight: "Our Team",
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
        { value: "rawalpindi", label: "Rawalpindi Branch" },
        { value: "islamabad", label: "Islamabad Branch" },
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
      address: "Rawalpindi Branch, Pakistan",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=Rawalpindi,+Pakistan&hl=en&z=14&output=embed",
      mapTitle: "BALITECH office location map",
    },
    contact: {
      hoursLabel: "Days Open",
      hours: "Monday – Friday (9:00 AM – 6:00 PM)",
      emailLabel: "Email",
      email: "info@balitech.com",
      phoneLabel: "Phone",
      phone: "0331 8638312",
      phoneHref: "tel:+923318638312",
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
