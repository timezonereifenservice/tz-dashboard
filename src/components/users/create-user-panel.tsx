"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { UserNavPermissionsEditor } from "@/components/users/user-nav-permissions-editor";
import { ToastNotification } from "@/components/system";
import type { UserType } from "@/lib/projects/access";
import {
  sanitizeNavPermissionsForRole,
  type UserNavPermissions,
} from "@/lib/users/nav-permissions";
import styles from "./users.module.css";

const ROLE_OPTIONS: { value: UserType; label: string; hint: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    hint: "Full access to all properties and user management.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    hint: "Manage content and leads for TZ Transport, Take & Bring, and TZ Reifenservice.",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    hint: "Read-only access to TZ Transport dashboards.",
  },
];

export function CreateUserPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("EDITOR");
  const [isActive, setIsActive] = useState(true);
  const [navPermissions, setNavPermissions] = useState<UserNavPermissions>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    variant: "success" | "error";
    title: string;
    meta?: string;
  } | null>(null);

  function handleRoleChange(nextRole: UserType) {
    setUserType(nextRole);
    setNavPermissions((current) =>
      sanitizeNavPermissionsForRole(nextRole, current),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setToast(null);
    setPending(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          userType,
          isActive,
          navPermissions: sanitizeNavPermissionsForRole(userType, navPermissions),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create user.");
      }

      router.push("/users");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create user.";
      setError(message);
      setToast({
        variant: "error",
        title: "Create failed",
        meta: message,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      {toast ? (
        <ToastNotification
          variant={toast.variant}
          title={toast.title}
          meta={toast.meta}
        />
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.detailHeader}>
          <Link href="/users" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Back to users
          </Link>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={pending}
          >
            <UserPlus size={16} aria-hidden />
            {pending ? "Creating…" : "Create user"}
          </button>
        </div>

        <section className={styles.detailHero}>
          <div className={styles.modalIcon}>
            <UserPlus size={24} aria-hidden />
          </div>
          <div className={styles.detailHeroText}>
            <h1 className={styles.detailTitle}>Create dashboard user</h1>
            <p className={styles.sectionHint}>
              Add a ConsoleHub account with role, status, and sidebar menu access.
            </p>
          </div>
        </section>

        <div className={styles.detailGrid}>
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Account details</h2>
              <p className={styles.sectionHint}>
                Email, password, role, and sign-in status for the new user.
              </p>
            </div>

            <div className={styles.sectionBody}>
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
                  className={styles.formInput}
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
                    className={styles.formInput}
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
                        onChange={() => handleRoleChange(option.value)}
                      />
                      <span className={styles.roleOptionLabel}>
                        {option.label}
                      </span>
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
          </section>

          <section className={styles.card}>
            <div className={styles.sectionBody}>
              <UserNavPermissionsEditor
                userType={userType}
                navPermissions={navPermissions}
                disabled={pending}
                onChange={setNavPermissions}
              />
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
