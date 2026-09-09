import { AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./system.module.css";

type ToastNotificationProps = {
  variant: "success" | "error";
  title: string;
  meta?: string;
  timeLabel?: string;
};

export function ToastNotification({
  variant,
  title,
  meta,
  timeLabel = "just now",
}: ToastNotificationProps) {
  return (
    <div className={styles.toast} role="status">
      <div className={styles.toastMain}>
        <div
          className={`${styles.toastIcon} ${
            variant === "success" ? styles.toastIconSuccess : styles.toastIconError
          }`}
        >
          {variant === "success" ? (
            <CheckCircle2 size={18} aria-hidden />
          ) : (
            <AlertCircle size={18} aria-hidden />
          )}
        </div>
        <div>
          <p className={styles.toastTitle}>{title}</p>
          {meta ? <p className={styles.toastMeta}>{meta}</p> : null}
        </div>
      </div>
      <span className={styles.toastTime}>{timeLabel}</span>
    </div>
  );
}
