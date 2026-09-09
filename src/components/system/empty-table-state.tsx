import type { ReactNode } from "react";
import { FolderSearch, RotateCcw, UserPlus } from "lucide-react";
import styles from "./system.module.css";

type EmptyTableStateProps = {
  title: string;
  description: ReactNode;
  tableLabel?: string;
  entryCount?: number;
  filters?: string[];
  onResetFilters?: () => void;
  resetLabel?: string;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryDisabled?: boolean;
  variant?: "card" | "embedded";
};

export function EmptyTableState({
  title,
  description,
  tableLabel,
  entryCount = 0,
  filters = [],
  onResetFilters,
  resetLabel = "Reset All Filters",
  secondaryLabel = "Add Manual Lead",
  onSecondaryAction,
  secondaryDisabled = true,
  variant = "card",
}: EmptyTableStateProps) {
  const body = (
    <div className={variant === "embedded" ? styles.emptyEmbedded : styles.emptyBody}>
      <div className={styles.emptyIcon}>
        <FolderSearch size={40} aria-hidden />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      <div className={styles.emptyActions}>
        {onResetFilters ? (
          <button type="button" className={styles.primaryAction} onClick={onResetFilters}>
            <RotateCcw size={18} aria-hidden />
            {resetLabel}
          </button>
        ) : null}
        {onSecondaryAction || secondaryDisabled ? (
          <button
            type="button"
            className={styles.secondaryAction}
            disabled={secondaryDisabled}
            title={secondaryDisabled ? "Coming soon" : undefined}
            onClick={onSecondaryAction}
          >
            <UserPlus size={18} aria-hidden />
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );

  if (variant === "embedded") {
    return body;
  }

  return (
    <div className={styles.emptyCard}>
      {tableLabel || filters.length > 0 ? (
        <div className={styles.emptyHeader}>
          {tableLabel ? (
            <div className={styles.emptyHeaderTitle}>
              <span>{tableLabel}</span>
              <span className={styles.emptyCount}>{entryCount} entries</span>
            </div>
          ) : (
            <span />
          )}
          {filters.length > 0 ? (
            <div className={styles.emptyFilters}>
              {filters.map((filter) => (
                <span key={filter} className={styles.emptyFilterChip}>
                  {filter}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {body}
    </div>
  );
}
