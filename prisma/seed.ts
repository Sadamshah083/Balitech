import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const programDescriptions: Record<string, string> = {
  "ACA Campaign": "Affordable Care Act enrollment and support campaigns.",
  "Medical Billing": "Professional medical billing and claims processing services.",
  Medicare: "Medicare enrollment and advisory campaign solutions.",
  "Medical Alert": "Medical alert device sales and verification campaigns.",
  "Final Expense": "Final expense insurance outreach and sales programs.",
  "BDO Services": "Business development and operational support services.",
  "B2B Campaigns": "Business-to-business lead generation and outreach.",
  "Lead Generation": "Targeted outbound campaigns that drive qualified leads.",
  "Inbound Call Services": "Expert handling of inbound customer inquiries.",
  "Outbound Call Services": "Proactive outbound sales and verification campaigns.",
  "Customer Support Services": "Dedicated customer support with 24/5 availability.",
  "Sales & Verification Campaigns":
    "Revenue-focused sales and compliance verification teams.",
};

const prisma = new PrismaClient();

const defaultCampaigns = [
  { title: "ACA Campaign", icon: "shield", order: 1 },
  { title: "Medical Billing", icon: "file-text", order: 2 },
  { title: "Medicare", icon: "heart-pulse", order: 3 },
  { title: "Medical Alert", icon: "bell", order: 4 },
  { title: "Final Expense", icon: "briefcase", order: 5 },
  { title: "BDO Services", icon: "users", order: 6 },
  { title: "B2B Campaigns", icon: "target", order: 7 },
  { title: "Lead Generation", icon: "trending-up", order: 8 },
  { title: "Inbound Call Services", icon: "headphones", order: 9 },
  { title: "Outbound Call Services", icon: "phone", order: 10 },
  { title: "Customer Support Services", icon: "clock", order: 11 },
  { title: "Sales & Verification Campaigns", icon: "zap", order: 12 },
];

const defaultBlogs = [
  {
    title: "How Bali Tech Scales US Campaign Operations",
    slug: "scales-us-campaign-operations",
    excerpt:
      "Discover how our Rawalpindi teams deliver high-volume outbound campaigns with quality assurance built in.",
    content:
      "Bali Tech has grown into one of Islamabad's most trusted BPO partners by combining skilled agents, modern dialer systems, and rigorous QA workflows.\n\nOur campaign teams are trained for vertical-specific scripts, compliance requirements, and conversion optimization. From Medicare to solar energy, each program gets a dedicated account manager and weekly performance reviews.\n\nClients benefit from transparent reporting, scalable seat counts, and 24/7 operational support — all designed to keep campaigns profitable and sustainable.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["BPO", "Campaigns", "Operations"]),
    format: "featured",
    order: 1,
  },
  {
    title: "5 Qualities of a High-Performing Call Center Team",
    slug: "high-performing-call-center-team",
    excerpt:
      "What separates good agents from top performers — and how we cultivate excellence at Bali Tech.",
    content:
      "High-performing call center teams share five core qualities: communication clarity, product knowledge, resilience, accountability, and teamwork.\n\nAt Bali Tech, we invest in continuous coaching, role-play sessions, and mentorship programs so every agent can grow. Our top performers are recognized monthly and given leadership pathways.\n\nThe result is higher CSAT scores, better conversion rates, and stronger client retention across every campaign we run.",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["Team", "Training", "Performance"]),
    format: "standard",
    order: 2,
  },
  {
    title: "Why Outsourcing to Pakistan Makes Strategic Sense",
    slug: "outsourcing-to-pakistan",
    excerpt:
      "Cost efficiency, English proficiency, and timezone overlap make Pakistan a smart BPO destination.",
    content:
      "Pakistan offers a unique combination of competitive labor costs, strong English communication skills, and favorable time-zone alignment with US and UK markets.\n\nBali Tech leverages this advantage with enterprise-grade infrastructure, secure data handling, and experienced leadership. Our Rawalpindi facility is built for scale without sacrificing quality.\n\nFor growing brands, outsourcing here means faster ramp-up, lower overhead, and access to a deep talent pool trained for international campaigns.",
    image:
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["Outsourcing", "Strategy", "BPO"]),
    format: "standard",
    order: 3,
  },
  {
    title: "Inside Our Annual Team Excellence Awards",
    slug: "annual-team-excellence-awards",
    excerpt:
      "A look at how we celebrate top agents and build a culture of recognition at Bali Tech.",
    content:
      "Every year, Bali Tech hosts an employee excellence ceremony to honor agents who lead in sales, support, attendance, and teamwork.\n\nWinners receive public recognition, performance bonuses, and career development opportunities. The event strengthens morale and sets a benchmark for the entire organization.\n\nCulture matters in call centers — and our awards night is one of the many ways we keep our teams motivated and engaged.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["Culture", "Awards", "Team"]),
    format: "compact",
    order: 4,
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@balitech.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        email,
        name: "Bali Tech Admin",
        password: await bcrypt.hash(password, 12),
      },
    });
    console.log(`Admin created: ${email}`);
  }

  const campaignCount = await prisma.campaign.count();
  if (campaignCount === 0) {
    await prisma.campaign.createMany({
      data: defaultCampaigns.map((c) => ({
        title: c.title,
        icon: c.icon,
        order: c.order,
        description:
          programDescriptions[c.title] ??
          `Professional ${c.title} solutions.`,
      })),
    });
    console.log("Default campaigns seeded.");
  }

  const blogCount = await prisma.blog.count();
  if (blogCount === 0) {
    await prisma.blog.createMany({ data: defaultBlogs });
    console.log("Default blogs seeded.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
