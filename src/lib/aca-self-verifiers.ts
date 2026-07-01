import type { AwardItem } from "@/components/landing/AwardDistribution";
import acaSelfVerifiersData from "@/lib/aca-self-verifiers.generated.json";

export const defaultAcaSelfVerifiers = acaSelfVerifiersData as AwardItem[];

export function toAcaSelfVerifierMediaItems() {
  return defaultAcaSelfVerifiers.map((item, index) => ({
    id: item.id,
    title: `${item.title} — ACA Self Verifiers Best Performer`,
    alt: item.alt ?? `${item.title} — ACA Self Verifiers Campaign at BALITECH`,
    src: item.image,
    kind: "image" as const,
    section: "aca-self-verifiers",
    category: "Awards",
    order: index + 1,
    isFeatured: false,
  }));
}
