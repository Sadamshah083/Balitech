"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Elements that can hold focus, for the Tab cycle inside the panel. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type AdminModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "md" suits a confirmation; "lg" fits a two-column form. */
  size?: "md" | "lg";
  /** Off while a request is in flight, so a save cannot be interrupted midway. */
  dismissible?: boolean;
};

/**
 * Dialog for the admin CRUD screens.
 *
 * The managers used to reveal their forms as a panel above the table. On a list
 * long enough to scroll — campaigns, leads, media — pressing Edit on a lower row
 * mutated state somewhere off-screen and read as a dead button. A dialog puts
 * the form where the click was and takes focus with it.
 *
 * Rendered through a portal because the admin sidebar is `fixed` at `z-50` and
 * the table sits inside an `overflow` container, either of which would otherwise
 * clip or cover the panel.
 */
export default function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "lg",
  dismissible = true,
}: AdminModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  /* Remembers the trigger so focus returns to the row's Edit button on close,
     rather than to the top of the document. */
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    return () => restoreFocusTo.current?.focus?.();
  }, [open]);

  /* Holds the page still underneath. Replacing the lost scrollbar width keeps
     the layout from jumping sideways as the dialog opens. */
  useEffect(() => {
    if (!open) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  /* Moves focus to the first field so the form is usable from the keyboard the
     moment it appears. */
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const targets = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (targets.length === 0) return;

      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;

      /* Wraps at both ends so Tab cannot reach the page behind the dialog. */
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, requestClose]);

  /* A dialog only opens from a click, so `open` is false on the server pass and
     both renders agree on nothing. The document check is belt and braces for a
     caller that ever mounts one already open. */
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-modal" role="presentation">
      <div
        className="admin-modal__backdrop"
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`admin-modal__panel admin-modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="admin-modal__header">
          <div>
            <h2 id={titleId} className="admin-modal__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="admin-modal__description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={!dismissible}
            className="admin-modal__close"
            aria-label={`Close ${title}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="admin-modal__body">{children}</div>

        {footer && <footer className="admin-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
