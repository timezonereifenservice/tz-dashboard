"use client";

import { useState } from "react";
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
  /** @deprecated No automatic retry interval — manual retry only. */
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
}: ConnectivityErrorBannerProps) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
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
              {retrying ? "Connecting…" : "Retry connection"}
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
