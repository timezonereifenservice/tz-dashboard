import type { LucideIcon } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import styles from "./tz-dashboard.module.css";

type BreakdownItem = {
  key: string;
  label: string;
  visitors: number;
  sharePct: number;
};

type BreakdownListProps = {
  title: string;
  icon: LucideIcon;
  items: BreakdownItem[];
  loading?: boolean;
  className?: string;
};

export function BreakdownList({
  title,
  icon: Icon,
  items,
  loading = false,
  className,
}: BreakdownListProps) {
  return (
    <DashboardCard className={className}>
      <p className={styles.sectionTitle}>{title}</p>
      {loading ? (
        <p className={styles.emptyHint}>Loading...</p>
      ) : items.length ? (
        <ul className={styles.breakdownList}>
          {items.map((item) => (
            <li key={item.key} className={styles.breakdownRow}>
              <div className={styles.breakdownLeft}>
                <Icon size={14} aria-hidden />
                <span className={styles.breakdownLabel}>{item.label}</span>
              </div>
              <div className={styles.breakdownRight}>
                <span className={styles.breakdownCount}>
                  {item.visitors.toLocaleString()}
                </span>
                <span className={styles.sharePill}>{item.sharePct}%</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyHint}>No data in this period.</p>
      )}
    </DashboardCard>
  );
}
