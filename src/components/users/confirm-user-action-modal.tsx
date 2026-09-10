"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import styles from "./users.module.css";

type ConfirmUserActionModalProps = {
  open: boolean;
  pending?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmUserActionModal({
  open,
  pending = false,
  title,
  description,
  confirmLabel,
  danger = false,
  onClose,
  onConfirm,
}: ConfirmUserActionModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (pending) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-user-action-title"
      onClick={handleBackdropClick}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div
              className={`${styles.modalIcon} ${
                danger ? styles.modalIconDanger : ""
              }`}
            >
              <AlertTriangle size={20} aria-hidden />
            </div>
            <div>
              <h2 id="confirm-user-action-title" className={styles.modalTitle}>
                {title}
              </h2>
              <p className={styles.modalSubtitle}>{description}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            aria-label="Close"
            disabled={pending}
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={danger ? styles.dangerButton : styles.primaryButton}
            disabled={pending}
            onClick={() => void onConfirm()}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
