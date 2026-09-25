import Image from "next/image";
import IntentLink from "@/components/navigation/IntentLink";
import { siteImages } from "@/lib/images";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  href?: string | null;
};

export default function BrandLogo({
  className,
  imageClassName,
  width = 224,
  height = 42,
  priority = false,
  href = "/",
}: BrandLogoProps) {
  const image = (
    <Image
      src={siteImages.logo}
      alt="BALITECH Pvt. Ltd"
      width={width}
      height={height}
        priority={priority}
        sizes="(max-width: 640px) 168px, 240px"
        className={cn(
        "brand-logo__img h-8 w-auto max-w-[10.5rem] object-contain sm:h-9",
        imageClassName
      )}
      style={{ width: "auto" }}
    />
  );

  const frame = (
    <span className={cn("brand-logo inline-flex items-center", className)}>
      {image}
    </span>
  );

  if (href) {
    return (
      /* Intent-triggered like the rest of the header: the logo is in the
         viewport from the first frame and points at "/", so on the home page it
         was prefetching a 10 KiB payload for the page it is already on. */
      <IntentLink
        href={href}
        className="brand-logo-link inline-flex shrink-0 leading-none transition-opacity hover:opacity-90"
      >
        {frame}
      </IntentLink>
    );
  }

  return frame;
}
