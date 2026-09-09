import Link from "next/link";
import { ArrowLeft, Mail, MapPinOff } from "lucide-react";
import styles from "./system.module.css";

type NotFoundStateProps = {
  backHref?: string;
  backLabel?: string;
  contactEmail?: string;
};

export function NotFoundState({
  backHref = "/",
  backLabel = "Back to Overview",
  contactEmail,
}: NotFoundStateProps) {
  return (
    <div className={styles.notFoundPanel}>
      <div className={styles.notFoundCodeWrap}>
        <span className={styles.notFoundCode} aria-hidden>
          404
        </span>
        <div className={styles.notFoundIconWrap}>
          <div className={styles.notFoundIcon}>
            <MapPinOff size={32} aria-hidden />
          </div>
        </div>
      </div>
      <h1 className={styles.notFoundTitle}>Page not found</h1>
      <p className={styles.notFoundDescription}>
        The requested dashboard endpoint or resource does not exist, or you may lack
        administrative privileges for this property sub-route.
      </p>
      <div className={styles.notFoundActions}>
        <Link href={backHref} className={styles.primaryAction}>
          <ArrowLeft size={18} aria-hidden />
          {backLabel}
        </Link>
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`} className={styles.notFoundSecondary}>
            Contact System Administrator
            <Mail size={16} aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
