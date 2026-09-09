"use client";

import type { AnalyticsDailyPoint } from "@/lib/adapters/types";
import styles from "./analytics.module.css";

type AnalyticsTimeSeriesChartProps = {
  series: AnalyticsDailyPoint[];
};

const WIDTH = 1000;
const HEIGHT = 240;
const PADDING = { top: 24, right: 24, bottom: 36, left: 24 };

function buildLinePath(values: number[], maxValue: number) {
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const lastIndex = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = PADDING.left + (index / lastIndex) * innerWidth;
      const normalized = maxValue > 0 ? value / maxValue : 0;
      const y = PADDING.top + (1 - normalized) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], maxValue: number) {
  const line = buildLinePath(values, maxValue);
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const baseline = HEIGHT - PADDING.bottom;
  const endX = PADDING.left + innerWidth;
  return `${line} L ${endX.toFixed(2)} ${baseline} L ${PADDING.left} ${baseline} Z`;
}

function pickAxisLabels(series: AnalyticsDailyPoint[]) {
  const indexes =
    series.length <= 4
      ? series.map((_, index) => index)
      : [...new Set([0, series.length - 1, ...Array.from(
          { length: 2 },
          (_, stepIndex) =>
            Math.min(
              series.length - 1,
              Math.floor(
                ((stepIndex + 1) * (series.length - 1)) /
                  3,
              ),
            ),
        )])].sort((a, b) => a - b);

  return indexes.map((index) => ({
    index,
    label: series[index]!.label,
  }));
}

export function AnalyticsTimeSeriesChart({
  series,
}: AnalyticsTimeSeriesChartProps) {
  const maxValue = Math.max(
    1,
    ...series.map((point) => Math.max(point.visitors, point.leads)),
  );
  const visitorValues = series.map((point) => point.visitors);
  const leadValues = series.map((point) => point.leads);
  const axisLabels = pickAxisLabels(series);
  const gridLines = [0.25, 0.5, 0.75].map(
    (ratio) => PADDING.top + ratio * (HEIGHT - PADDING.top - PADDING.bottom),
  );

  return (
    <div className={styles.chartArea}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Daily visitors and leads chart"
      >
        <defs>
          <linearGradient id="visitorAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1B4D89" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1B4D89" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="conversionAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#006c4b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#006c4b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((y) => (
          <line
            key={y}
            x1={PADDING.left}
            y1={y}
            x2={WIDTH - PADDING.right}
            y2={y}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
        ))}

        <path
          d={buildAreaPath(visitorValues, maxValue)}
          fill="url(#visitorAreaGrad)"
        />
        <path
          d={buildAreaPath(leadValues, maxValue)}
          fill="url(#conversionAreaGrad)"
        />
        <path
          d={buildLinePath(visitorValues, maxValue)}
          fill="none"
          stroke="#1B4D89"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={buildLinePath(leadValues, maxValue)}
          fill="none"
          stroke="#006c4b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className={styles.chartAxis}>
        {axisLabels.map(({ index, label }) => (
          <span
            key={`${index}-${label}`}
            style={{
              position: "absolute",
              left: `${((index / Math.max(series.length - 1, 1)) * 100).toFixed(2)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
