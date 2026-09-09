import styles from "./system.module.css";

type KpiSkeletonGridProps = {
  count?: number;
  paused?: boolean;
};

type TableRowSkeletonProps = {
  rows?: number;
  paused?: boolean;
};

type PageLoadingSkeletonProps = {
  kpiCount?: number;
  tableRows?: number;
};

function SkeletonBar({
  width,
  height = "1rem",
  className = "",
}: {
  width: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`${styles.skeletonBlock} ${styles.skeletonPulse} ${className}`}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function KpiSkeletonGrid({ count = 4, paused = false }: KpiSkeletonGridProps) {
  return (
    <div className={`${styles.kpiSkeletonGrid} ${paused ? styles.skeletonPaused : ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.kpiSkeletonCard}>
          <div className={styles.kpiSkeletonHead}>
            <SkeletonBar width="6rem" height="0.875rem" />
            <SkeletonBar width="2rem" height="2rem" className="rounded-lg" />
          </div>
          <SkeletonBar width="8rem" height="2rem" />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <SkeletonBar width="3rem" height="0.875rem" />
            <SkeletonBar width="5rem" height="0.75rem" />
          </div>
          <SkeletonBar width="100%" height="0.25rem" />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 4, paused = false }: TableRowSkeletonProps) {
  return (
    <div className={`${styles.tableSkeletonCard} ${paused ? styles.skeletonPaused : ""}`}>
      <div className={styles.tableSkeletonHead}>
        <SkeletonBar width="6rem" height="0.875rem" />
        <SkeletonBar width="10rem" height="0.875rem" />
      </div>
      <div className={styles.tableSkeletonBody}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={styles.tableSkeletonRow}>
            <div className={styles.tableSkeletonLead}>
              <SkeletonBar width="2.25rem" height="2.25rem" className="rounded-full" />
              <div className={styles.tableSkeletonLeadText}>
                <SkeletonBar width="75%" height="0.875rem" />
                <SkeletonBar width="50%" height="0.625rem" />
              </div>
            </div>
            <SkeletonBar width="25%" height="0.875rem" />
            <SkeletonBar width="5rem" height="1.5rem" className="rounded-full" />
            <SkeletonBar width="4rem" height="2rem" className="rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoadingSkeleton({
  kpiCount = 4,
  tableRows = 4,
}: PageLoadingSkeletonProps) {
  return (
    <div className={styles.pageSkeleton} aria-busy="true" aria-label="Loading content">
      <div className={styles.pageSkeletonHeader}>
        <SkeletonBar width="12rem" height="2rem" />
        <SkeletonBar width="24rem" height="0.875rem" />
      </div>
      <KpiSkeletonGrid count={kpiCount} />
      <TableRowSkeleton rows={tableRows} />
    </div>
  );
}
