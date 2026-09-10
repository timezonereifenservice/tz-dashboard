import type { ReactNode } from "react";
import styles from "./tz-dashboard.module.css";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  large?: boolean;
};

export function DashboardCard({
  children,
  className,
  large = false,
}: DashboardCardProps) {
  return (
    <div className={`${large ? styles.cardLg : styles.card} ${className ?? ""}`}>
      {children}
    </div>
  );
}

type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <DashboardCard large>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions}
      </div>
    </DashboardCard>
  );
}
