"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, X } from "lucide-react";
import styles from "./system.module.css";

type ConnectivityErrorBannerProps = {
  title: string;
  message: string;
  cluster?: string;
  port?: string;
  onRetry?: () => void | Promise<void>;
  statusPageHref?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  retryIntervalSeconds?: number;
};

export function ConnectivityErrorBanner({
  title,
  message,
  cluster,
  port,
  onRetry,
  statusPageHref,
  dismissible = true,
  onDismiss,
  retryIntervalSeconds = 24,
}: ConnectivityErrorBannerProps) {
  const [countdown, setCountdown] = useState(retryIntervalSeconds);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => (value <= 1 ? retryIntervalSeconds : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryIntervalSeconds]);

  async function handleRetry() {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
      setCountdown(retryIntervalSeconds);
    } finally {
      window.setTimeout(() => setRetrying(false), 600);
    }
  }

  return (
    <div className={styles.connectivityBanner} role="alert">
      <div className={styles.connectivityAccent} aria-hidden />
      <div className={styles.connectivityInner}>
        <div className={styles.connectivityMain}>
          <div className={styles.connectivityIcon}>
            <AlertTriangle size={24} aria-hidden />
          </div>
          <div>
            <div className={styles.connectivityTitleRow}>
              <span className={styles.connectivityTitle}>{title}</span>
              {cluster ? (
                <span className={styles.connectivityChip}>{cluster}</span>
              ) : null}
              {port ? (
                <span className={`${styles.connectivityChip} ${styles.connectivityChipMuted}`}>
                  PORT {port}
                </span>
              ) : null}
            </div>
            <p className={styles.connectivityMessage}>{message}</p>
          </div>
        </div>

        <div className={styles.connectivityActions}>
          {onRetry ? (
            <button
              type="button"
              className={styles.retryButton}
              disabled={retrying}
              onClick={handleRetry}
            >
              {retrying ? (
                <Loader2 size={16} className={styles.retrySpin} aria-hidden />
              ) : null}
              {retrying ? "Connecting…" : `Retry Connection (${countdown}s)`}
            </button>
          ) : null}
          {statusPageHref ? (
            <a
              className={styles.linkButton}
              href={statusPageHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Status Page
              <ExternalLink size={14} aria-hidden />
            </a>
          ) : null}
          {dismissible && onDismiss ? (
            <button
              type="button"
              className={styles.dismissButton}
              aria-label="Dismiss banner"
              onClick={onDismiss}
            >
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
