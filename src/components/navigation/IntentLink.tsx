"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A `<Link>` that waits for a sign of interest before prefetching its route.
 *
 * Next prefetches every link in the viewport, which is normally what you want.
 * Dense chrome (footer, cards) can otherwise download many routes at once.
 *
 * Arm on pointerdown (before click) so the first tap still navigates warmly.
 * `prefetch={true}` once armed; until then stay at `false`.
 */
export default function IntentLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  onPointerDown,
  ...rest
}: IntentLinkProps) {
  const [armed, setArmed] = useState(false);
  const arm = () => setArmed(true);

  return (
    <Link
      {...rest}
      prefetch={armed}
      onPointerDown={(event) => {
        arm();
        onPointerDown?.(event);
      }}
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
