import { Card, CardContent, Typography, Stack, Box } from "@mui/material";

type DashboardCardProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export function DashboardCard({
  title,
  subtitle,
  action,
  footer,
  children,
}: DashboardCardProps) {
  return (
    <Card sx={{ padding: 0 }} elevation={9}>
      <CardContent sx={{ p: "30px" }}>
        {title ? (
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mb={children ? 3 : 0}
          >
            <Box>
              <Typography variant="h5">{title}</Typography>
              {subtitle ? (
                <Typography variant="subtitle2" color="textSecondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {action}
          </Stack>
        ) : null}
        {children}
      </CardContent>
      {footer}
    </Card>
  );
}
