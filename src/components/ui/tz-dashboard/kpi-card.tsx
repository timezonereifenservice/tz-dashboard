import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import styles from "./tz-dashboard.module.css";

type KpiCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  changePct?: number;
  loading?: boolean;
};

function formatPct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  changePct,
  loading = false,
}: KpiCardProps) {
  return (
    <DashboardCard>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>
        {loading
          ? "--"
          : typeof value === "number"
            ? value.toLocaleString()
            : value}
      </p>
      <div className={styles.kpiMeta}>
        <Icon size={14} aria-hidden />
        {changePct !== undefined && !loading ? (
          <span
            className={
              changePct >= 0 ? styles.kpiChangeUp : styles.kpiChangeDown
            }
          >
            {changePct >= 0 ? (
              <TrendingUp size={12} aria-hidden />
            ) : (
              <TrendingDown size={12} aria-hidden />
            )}
            {formatPct(changePct)} vs prev period
          </span>
        ) : (
          <span>Current period</span>
        )}
      </div>
    </DashboardCard>
  );
}
