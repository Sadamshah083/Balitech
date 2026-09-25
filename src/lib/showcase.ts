import type { PublicMediaItem } from "@/lib/media";
import type { ShowcaseItem } from "@/components/media/MediaShowcase";

type ToShowcaseOptions = {
  exclude?: Set<string>;
};

/** Maps media rows to showcase items, dropping blanks, videos and duplicates. */
export function toShowcaseItems(
  media: PublicMediaItem[],
  { exclude }: ToShowcaseOptions = {}
): ShowcaseItem[] {
  const seen = new Set<string>();
  const items: ShowcaseItem[] = [];

  for (const item of media) {
    const src = item.src?.trim();
    if (item.kind !== "image" || !src) continue;
    if (seen.has(src) || exclude?.has(src)) continue;

    seen.add(src);
    items.push({
      id: item.id,
      title: item.title,
      image: src,
      alt: item.alt,
      featured: item.isFeatured,
    });
  }

  return items;
}

/**
 * Tracks every image already rendered on a page so that later sections can skip
 * photos an earlier section has shown. The media catalog intentionally lists the
 * same file under several sections, which otherwise surfaces the same photo two
 * or three times on /gallery.
 */
export function createMediaDeduper(seed: Iterable<string> = []) {
  const used = new Set<string>(seed);

  return {
    /** Returns the items whose image has not been rendered yet, and claims them. */
    claim<T extends { src?: string | null }>(items: T[]): T[] {
      const kept: T[] = [];

      for (const item of items) {
        const src = item.src?.trim();
        if (!src || used.has(src)) continue;
        used.add(src);
        kept.push(item);
      }

      return kept;
    },
    /** Images already claimed, for sections that filter internally. */
    get claimed() {
      return used;
    },
  };
}
