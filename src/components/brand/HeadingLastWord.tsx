import { cn } from "@/lib/cn";

export function HeadingBrush({ className }: { className?: string }) {
  return (
    <span className={cn("heading-brush", className)} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

type HeadingLastWordProps = {
  text: string;
  className?: string;
  lastWordClassName?: string;
};

export function HeadingLastWord({
  text,
  className,
  lastWordClassName,
}: HeadingLastWordProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return null;

  if (words.length === 1) {
    return (
      <span className={cn("heading-last-word", className, lastWordClassName)}>
        {words[0]}
        <HeadingBrush />
      </span>
    );
  }

  const last = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");

  return (
    <span className={className}>
      {rest}{" "}
      <span className={cn("heading-last-word", lastWordClassName)}>
        {last}
        <HeadingBrush />
      </span>
    </span>
  );
}
