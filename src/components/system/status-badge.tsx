import styles from "./system.module.css";

export const LEAD_STATUS_OPTIONS = [
  "NEW",
  "READ",
  "ARCHIVED",
  "CONTACTED",
  "QUALIFIED",
  "QUOTED",
  "NEGOTIATION",
  "CONFIRMED",
  "WON",
  "LOST",
] as const;

export function statusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case "NEW":
      return styles.statusNew;
    case "READ":
      return styles.statusRead;
    case "CONTACTED":
      return styles.statusContacted;
    case "QUALIFIED":
      return styles.statusQualified;
    case "QUOTED":
      return styles.statusQuoted;
    case "NEGOTIATION":
      return styles.statusNegotiation;
    case "CONFIRMED":
      return styles.statusConfirmed;
    case "WON":
      return styles.statusWon;
    case "LOST":
      return styles.statusLost;
    case "ARCHIVED":
      return styles.statusArchived;
    default:
      return styles.statusDefault;
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.statusBadge} ${statusBadgeClass(status)}`}>
      <span className={styles.statusDot} aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  );
}
