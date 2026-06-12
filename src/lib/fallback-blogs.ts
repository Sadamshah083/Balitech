export type FallbackBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  tags: string;
  format: string;
  order: number;
  createdAt: string;
};

export const fallbackBlogs: FallbackBlog[] = [
  {
    id: "fallback-1",
    title: "How BALITECH Scales US Campaign Operations",
    slug: "scales-us-campaign-operations",
    excerpt:
      "Discover how our teams deliver high-volume outbound campaigns with quality assurance built in.",
    content:
      "BALITECH combines skilled agents, modern dialer systems, and rigorous QA workflows to scale US campaigns with consistency and compliance.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["BPO", "Campaigns", "Operations"]),
    format: "featured",
    order: 1,
    createdAt: "2025-11-12T00:00:00.000Z",
  },
  {
    id: "fallback-2",
    title: "5 Qualities of a High-Performing Call Center Team",
    slug: "high-performing-call-center-team",
    excerpt:
      "What separates good agents from top performers — and how we cultivate excellence at BALITECH.",
    content:
      "High-performing call center teams share communication clarity, product knowledge, resilience, accountability, and teamwork.",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["Team", "Training", "Performance"]),
    format: "standard",
    order: 2,
    createdAt: "2025-10-28T00:00:00.000Z",
  },
  {
    id: "fallback-3",
    title: "Why Outsourcing to Pakistan Makes Strategic Sense",
    slug: "outsourcing-to-pakistan",
    excerpt:
      "Cost efficiency, English proficiency, and timezone overlap make Pakistan a smart BPO destination.",
    content:
      "Pakistan offers competitive labor costs, strong English communication, and favorable time-zone alignment with US and UK markets.",
    image:
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    tags: JSON.stringify(["Outsourcing", "Strategy", "BPO"]),
    format: "standard",
    order: 3,
    createdAt: "2025-10-05T00:00:00.000Z",
  },
];
