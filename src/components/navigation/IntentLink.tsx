"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A `<Link>` that waits for a sign of interest before prefetching its route.
 *
 * Next prefetches every link in the viewport, which is normally what you want.
 * The header, though, carries eight links and is on screen from the first
 * frame, so a cold visit downloaded eight routes' worth of chunks — around
 * 237 KB, none of it executed — while the page it was on was still trying to
 * paint.
 *
 * Hover, touch and focus all count, so navigation is still warm by the time
 * anything is clicked: `prefetch={null}` restores Next's own behaviour rather
 * than reimplementing it, and once armed it stays armed.
 */
export default function IntentLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...rest
}: IntentLinkProps) {
  const [armed, setArmed] = useState(false);
  const arm = () => setArmed(true);

  return (
    <Link
      {...rest}
      prefetch={armed ? null : false}
      onMouseEnter={(event) => {
        arm();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        arm();
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        arm();
        onFocus?.(event);
      }}
    />
  );
}
