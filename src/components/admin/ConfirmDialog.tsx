"use client";

import { AlertTriangle } from "lucide-react";
import AdminModal from "./AdminModal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Shown in place of the buttons when the request fails. */
  error?: string | null;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Destructive-action confirmation.
 *
 * This exists because `window.confirm` is not dependable for a screen that
 * deletes rows one after another: Chrome adds a "prevent this page from
 * creating additional dialogs" checkbox after repeated prompts, and once it is
 * ticked every later `confirm` returns false without showing anything. Delete
 * then looks broken for the rest of the session with no way to tell why.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  error,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AdminModal
      open={open}
      title={title}
      onClose={onCancel}
      size="md"
      dismissible={!pending}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="admin-modal__btn admin-modal__btn--ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="admin-modal__btn admin-modal__btn--danger"
          >
            {pending ? "Deleting..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className="admin-modal__confirm">
        <span className="admin-modal__confirm-icon" aria-hidden="true">
          <AlertTriangle size={20} />
        </span>
        <p className="admin-modal__confirm-text">{message}</p>
      </div>
      {error && (
        <p className="admin-modal__error" role="alert">
          {error}
        </p>
      )}
    </AdminModal>
  );
}
