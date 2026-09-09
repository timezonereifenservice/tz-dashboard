"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { brand } from "@/lib/brand";
import styles from "./login.module.css";

const REMEMBER_EMAIL_KEY = "consolehub-remember-email";

export function LoginPageView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowError(false);
    setPending(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setError(
          data.message ??
            "Invalid credentials. Please check your corporate email and password.",
        );
        setShowError(true);
        return;
      }

      if (remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Try again.");
      setShowError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.shell}>
          <div className={`${styles.orb} ${styles.orbMint}`} aria-hidden />
          <div className={`${styles.orb} ${styles.orbBlue}`} aria-hidden />
          <div className={`${styles.orb} ${styles.orbSky}`} aria-hidden />

          <div className={styles.card}>
            <header className={styles.header}>
              <div className={styles.logoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.markSrc}
                  alt={`${brand.name} logo`}
                  className={styles.logo}
                />
              </div>
              <h1 className={styles.title}>{brand.name}</h1>
              <p className={styles.tagline}>{brand.tagline}</p>
              <div className={styles.accountBadge}>
                <Lock className={styles.iconSm} aria-hidden />
                <span>Sign in with your TZ Transport account</span>
              </div>
            </header>

            {showError && error ? (
              <div className={styles.alert} role="alert">
                <div className={styles.alertBody}>
                  <AlertCircle className={styles.iconMd} aria-hidden />
                  <p className={styles.alertText}>{error}</p>
                </div>
                <button
                  type="button"
                  className={styles.alertDismiss}
                  aria-label="Dismiss alert"
                  onClick={() => setShowError(false)}
                >
                  <X className={styles.iconMd} aria-hidden />
                </button>
              </div>
            ) : null}

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="corporate-email">
                  Email address
                </label>
                <div className={styles.inputWrap}>
                  <Mail className={styles.inputIcon} size={18} aria-hidden />
                  <input
                    id="corporate-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@tz-transport.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="corporate-password">
                    Password
                  </label>
                  <span className={styles.linkMuted}>Forgot password?</span>
                </div>
                <div className={styles.inputWrap}>
                  <KeyRound className={styles.inputIcon} size={18} aria-hidden />
                  <input
                    id="corporate-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputPassword}`}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} aria-hidden />
                    ) : (
                      <Eye size={20} aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Remember this workstation</span>
                </label>
                <span className={styles.ssoHint}>SSO ready</span>
              </div>

              <button
                type="submit"
                className={styles.submit}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className={styles.securityNote}>
              <ShieldCheck
                className={`${styles.iconMd} ${styles.iconSecondary}`}
                aria-hidden
              />
              <p className={styles.securityText}>
                Secured with enterprise role-based access control (RBAC).
                Protected internal tool.
              </p>
            </div>

            <div className={styles.footer}>
              <span>{brand.name}</span>
              <span className={styles.status}>
                <span className={styles.statusDot} aria-hidden />
                Operational Systems OK
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
