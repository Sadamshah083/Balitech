import Image from "next/image";
import Link from "next/link";
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
      unoptimized
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
      <Link
        href={href}
        className="brand-logo-link inline-flex shrink-0 leading-none transition-opacity hover:opacity-90"
      >
        {frame}
      </Link>
    );
  }

  return frame;
}
