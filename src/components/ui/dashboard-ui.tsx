"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { formatNumber, formatPct } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string | number;
  change?: number;
  hint?: string;
};

export function KpiCard({ label, value, change, hint }: KpiCardProps) {
  return (
    <DashboardCard>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h3" fontWeight={700} mt={1}>
        {typeof value === "number" ? formatNumber(value) : value}
      </Typography>
      {change !== undefined ? (
        <Typography
          variant="body2"
          mt={1}
          color={change >= 0 ? "success.main" : "text.secondary"}
          fontWeight={500}
        >
          {formatPct(change)} vs previous period
        </Typography>
      ) : null}
      {hint ? (
        <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
          {hint}
        </Typography>
      ) : null}
    </DashboardCard>
  );
}

type BreakdownTableProps = {
  title: string;
  rows: Array<{ label: string; value: number; sharePct?: number }>;
  valueLabel?: string;
};

export function BreakdownTable({ title, rows, valueLabel = "Count" }: BreakdownTableProps) {
  return (
    <DashboardCard title={title}>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No data yet
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">{valueLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label} hover>
                <TableCell>
                  <Typography variant="body2">{row.label}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                    {row.sharePct !== undefined ? (
                      <Typography variant="caption" color="text.secondary">
                        {row.sharePct}%
                      </Typography>
                    ) : null}
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(row.value)}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardCard>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "flex-end" }}
      spacing={2}
      mb={3}
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}

export function PeriodToggle({
  period,
  onChange,
}: {
  period: "7d" | "30d";
  onChange: (period: "7d" | "30d") => void;
}) {
  return (
    <ButtonGroup variant="outlined" size="small">
      <Button
        variant={period === "7d" ? "contained" : "outlined"}
        onClick={() => onChange("7d")}
      >
        7 days
      </Button>
      <Button
        variant={period === "30d" ? "contained" : "outlined"}
        onClick={() => onChange("30d")}
      >
        30 days
      </Button>
    </ButtonGroup>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Chip
      label={status.replace(/_/g, " ")}
      size="small"
      color="primary"
      variant="outlined"
      sx={{ textTransform: "uppercase", fontWeight: 600, fontSize: "0.65rem" }}
    />
  );
}
