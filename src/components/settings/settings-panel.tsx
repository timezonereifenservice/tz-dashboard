"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { DashboardUser } from "@/lib/auth/types";
import type { ProjectConfig } from "@/lib/projects/config";
import {
  formatBlogDate,
  formatRelativeTime,
  getInitials,
} from "@/lib/utils";
import styles from "./settings.module.css";

type SessionInfo = {
  startedAt: string | null;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

type SettingsPanelProps = {
  user: DashboardUser;
  passwordUpdatedAt: string | null;
  accessibleProjects: ProjectConfig[];
  session: SessionInfo | null;
};

type PasswordRule = {
  id: string;
  label: string;
  wide?: boolean;
  test: (value: string) => boolean;
};

const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "Minimum 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "symbols",
    label: "Includes numbers & symbols",
    test: (value) => /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value),
  },
  {
    id: "case",
    label: "Contains lowercase & uppercase letters",
    wide: true,
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
];

function displayName(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(userType: DashboardUser["userType"]) {
  switch (userType) {
    case "ADMIN":
      return "Global Admin";
    case "EDITOR":
      return "Editor";
    default:
      return "Viewer";
  }
}

function roleBadge(userType: DashboardUser["userType"]) {
  switch (userType) {
    case "ADMIN":
      return "Console Admin";
    case "EDITOR":
      return "Editor";
    default:
      return "Viewer";
  }
}

function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return "Unknown client";

  let browser = "Browser";
  if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome/")) browser = "Chrome";
  else if (userAgent.includes("Firefox/")) browser = "Firefox";
  else if (userAgent.includes("Safari/")) browser = "Safari";

  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  return `${browser} • ${os}`;
}

function getStrength(password: string, metCount: number) {
  if (!password) {
    return { score: 0, label: "Enter a password", className: styles.strengthWeak };
  }
  if (metCount <= 1) {
    return { score: 1, label: "Weak", className: styles.strengthWeak };
  }
  if (metCount === 2) {
    return { score: 2, label: "Fair", className: styles.strengthFair };
  }
  if (metCount === 3 && password.length < 12) {
    return { score: 3, label: "Good", className: styles.strengthGood };
  }
  return { score: 4, label: "Strong", className: styles.strengthStrong };
}

function strengthBarClass(score: number, index: number) {
  if (score <= index) return styles.strengthBar;
  if (score <= 1) return `${styles.strengthBar} ${styles.strengthBarActiveWeak}`;
  if (score === 2) return `${styles.strengthBar} ${styles.strengthBarActiveFair}`;
  return `${styles.strengthBar} ${styles.strengthBarActive}`;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  inputClassName,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  inputClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label} <span className={styles.required}>*</span>
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.input} ${inputClassName ?? ""}`}
          autoComplete={id.includes("current") ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className={styles.toggleButton}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
    </div>
  );
}

export function SettingsPanel({
  user,
  passwordUpdatedAt,
  accessibleProjects,
  session,
}: SettingsPanelProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);

  const name = displayName(user.email);
  const metRules = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(newPassword) })),
    [newPassword],
  );
  const metCount = metRules.filter((rule) => rule.met).length;
  const strength = getStrength(newPassword, metCount);
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirmation do not match.");
      setIsError(true);
      return;
    }

    if (metCount < PASSWORD_RULES.length) {
      setMessage("Please meet all password complexity requirements.");
      setIsError(true);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { message?: string };
      const text = data.message ?? (res.ok ? "Password updated." : "Update failed.");
      setMessage(text);
      setIsError(!res.ok);
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.description}>
            Manage your ConsoleHub account security and credentials across unified
            properties.
          </p>
        </div>
        <div className={styles.scopeChip}>
          <Globe size={16} aria-hidden />
          <span>
            Active Scope: <strong>{roleLabel(user.userType)}</strong>
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Lock size={20} aria-hidden />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Change Password</h2>
                <p className={styles.cardSubtitle}>
                  Update your password to maintain account security across all unified
                  properties.
                </p>
              </div>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <PasswordField
                id="current-password"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                hint="Authenticate identity before setting replacement credentials."
              />

              <PasswordField
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter strong new password"
                inputClassName={styles.inputNew}
              />

              <div className={styles.rulesBox}>
                <span className={styles.rulesTitle}>Complexity Standards</span>
                <div className={styles.rulesGrid}>
                  {metRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`${styles.ruleItem} ${rule.wide ? styles.ruleItemWide : ""}`}
                    >
                      <span
                        className={`${styles.ruleIcon} ${rule.met ? styles.ruleIconMet : ""}`}
                        aria-hidden
                      >
                        {rule.met ? <Check size={10} strokeWidth={3} /> : null}
                      </span>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.strengthHead}>
                  <span className={styles.strengthLabel}>Password Strength</span>
                  <span className={`${styles.strengthValue} ${strength.className}`}>
                    {strength.label}
                  </span>
                </div>
                <div className={styles.strengthBars}>
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className={strengthBarClass(strength.score, index)} />
                  ))}
                </div>
              </div>

              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat new password"
                inputClassName={styles.inputNew}
              />
              {!passwordsMatch ? (
                <p className={`${styles.feedback} ${styles.feedbackError}`}>
                  Passwords do not match.
                </p>
              ) : null}

              <div className={styles.formFooter}>
                <div className={styles.lastChanged}>
                  <Clock size={16} aria-hidden />
                  <span>
                    Last changed:{" "}
                    <span className={styles.lastChangedStrong}>
                      {passwordUpdatedAt
                        ? `${formatBlogDate(passwordUpdatedAt)} (${formatRelativeTime(passwordUpdatedAt)})`
                        : "Not available"}
                    </span>
                  </span>
                </div>
                <button type="submit" className={styles.submitButton} disabled={pending}>
                  {pending ? "Updating…" : "Update Password"}
                </button>
              </div>

              {message ? (
                <p
                  className={`${styles.feedback} ${
                    isError ? styles.feedbackError : styles.feedbackSuccess
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>
          </section>

          <div className={styles.policyBox}>
            <div className={styles.policyIcon}>
              <Shield size={16} aria-hidden />
            </div>
            <p>
              <strong>ConsoleHub Organization Credentials Policy:</strong> Passwords should
              meet the complexity standards above. Resetting your password will require you
              to sign in again on other devices once their sessions expire.
            </p>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.profileHead}>
              <div className={styles.avatar}>{getInitials(name)}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h3 className={styles.profileName}>{name}</h3>
                  <span className={styles.roleBadge}>{roleBadge(user.userType)}</span>
                </div>
                <div className={styles.profileEmailRow}>
                  <span>{user.email}</span>
                  <BadgeCheck size={14} className={styles.verifiedIcon} aria-hidden />
                </div>
              </div>
            </div>
            <div className={styles.scopeSection}>
              <span className={styles.scopeLabel}>Global Authority Scope</span>
              <p className={styles.scopeText}>
                {user.userType === "ADMIN"
                  ? "Full administrative privilege across "
                  : user.userType === "EDITOR"
                    ? "Editor access across "
                    : "Read-only access to "}
                {accessibleProjects.map((project, index) => (
                  <span key={project.id}>
                    <strong>{project.name}</strong>
                    {index < accessibleProjects.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            </div>
          </section>

          <section className={`${styles.card} ${styles.cardBody}`}>
            <div className={styles.sideCardTitleRow}>
              <div className={styles.sideCardTitleWrap}>
                <div className={`${styles.sideCardIcon} ${styles.sideCardIconMuted}`}>
                  <ShieldCheck size={16} aria-hidden />
                </div>
                <h3 className={styles.sideCardTitle}>Two-Factor Authentication</h3>
              </div>
              <span className={`${styles.statusBadge} ${styles.statusBadgeMuted}`}>
                Not Enabled
              </span>
            </div>
            <p className={styles.sideCardText}>
              Two-factor authentication is not configured for ConsoleHub accounts yet. Password
              changes and session management remain available on this page.
            </p>
          </section>

          <section className={`${styles.card} ${styles.cardBody}`}>
            <div className={styles.sideCardTitleRow}>
              <h3 className={styles.sideCardTitle}>Active Session</h3>
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} aria-hidden />
                Live
              </span>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Device & Client</span>
                <span className={styles.metaValue}>{parseUserAgent(session?.userAgent ?? null)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>IP Address</span>
                <span className={`${styles.metaValue} ${styles.metaMono}`}>
                  {session?.ipAddress ?? "Not recorded"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Session Started</span>
                <span className={styles.metaValue}>
                  {session?.startedAt ? formatBlogDate(session.startedAt) : "Not available"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Last Activity</span>
                <span className={styles.metaValue}>
                  {session?.lastUsedAt
                    ? formatRelativeTime(session.lastUsedAt)
                    : "Not available"}
                </span>
              </div>
            </div>

            <button type="button" className={styles.dangerButton} disabled title="Coming soon">
              Revoke Other Sessions
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
