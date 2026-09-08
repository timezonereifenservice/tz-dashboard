"use client";

import { Box, Card, Grid, Stack, Typography } from "@mui/material";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { brand } from "@/lib/brand";

export function LoginPageView() {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        "&:before": {
          content: '""',
          background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
          backgroundSize: "400% 400%",
          position: "absolute",
          height: "100%",
          width: "100%",
          opacity: 0.3,
        },
      }}
    >
      <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: "100vh", px: 2 }}>
        <Grid size={{ xs: 12, sm: 10, md: 6, lg: 4 }}>
          <Card elevation={9} sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: 500, mx: "auto" }}>
            <Stack alignItems="center" spacing={1} mb={3}>
              <BrandLogo href="/" variant="full" height={44} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {brand.tagline}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Sign in with your TZ Transport account
              </Typography>
            </Stack>
            <LoginForm />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
