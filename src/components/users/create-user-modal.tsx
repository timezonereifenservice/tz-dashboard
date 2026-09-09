"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, UserPlus, X } from "lucide-react";
import type { UserType } from "@/lib/projects/access";
import styles from "./users.module.css";

type CreateUserModalProps = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: {
    email: string;
    password: string;
    userType: UserType;
    isActive: boolean;
  }) => Promise<void>;
};

const ROLE_OPTIONS: { value: UserType; label: string; hint: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    hint: "Full access to all properties and user management.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    hint: "Manage content and leads for TZ Transport and Take & Bring.",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    hint: "Read-only access to TZ Transport dashboards.",
  },
];

export function CreateUserModal({
  open,
  pending,
  onClose,
  onSubmit,
}: CreateUserModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("EDITOR");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setUserType("EDITOR");
      setIsActive(true);
      setShowPassword(false);
      setError(null);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit({ email, password, userType, isActive });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create user.",
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <form className={styles.modalCard} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div className={styles.modalIcon}>
              <UserPlus size={20} aria-hidden />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Create dashboard user</h2>
              <p className={styles.modalSubtitle}>
                Add a ConsoleHub account stored in the TZ Transport auth database.
              </p>
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

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="create-user-email">
              Email <span className={styles.required}>*</span>
            </label>
            <input
              id="create-user-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              disabled={pending}
              placeholder="name@company.com"
              className={styles.input}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="create-user-password">
              Temporary password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                id="create-user-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                disabled={pending}
                placeholder="Minimum 8 characters"
                className={styles.input}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.toggleButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={pending}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden />
                ) : (
                  <Eye size={16} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              Role <span className={styles.required}>*</span>
            </span>
            <div className={styles.roleGrid}>
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`${styles.roleOption} ${
                    userType === option.value ? styles.roleOptionActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value={option.value}
                    checked={userType === option.value}
                    disabled={pending}
                    className={styles.roleInput}
                    onChange={() => setUserType(option.value)}
                  />
                  <span className={styles.roleOptionLabel}>{option.label}</span>
                  <span className={styles.roleOptionHint}>{option.hint}</span>
                </label>
              ))}
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isActive}
              disabled={pending}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span>Account is active and can sign in immediately</span>
          </label>

          {error ? <p className={styles.formError}>{error}</p> : null}
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
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
