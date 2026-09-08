"use client";

import { AppBar, Box, IconButton, Stack, Toolbar, Typography, styled } from "@mui/material";
import { IconMenu } from "@tabler/icons-react";
import { ProfileMenu } from "@/components/layout/profile-menu";
import type { DashboardUser } from "@/lib/auth/types";

type HeaderProps = {
  toggleMobileSidebar: () => void;
  pageTitle: string;
  user: DashboardUser;
};

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  boxShadow: "none",
  background: theme.palette.background.paper,
  justifyContent: "center",
  backdropFilter: "blur(4px)",
  [theme.breakpoints.up("lg")]: {
    minHeight: "70px",
  },
}));

const ToolbarStyled = styled(Toolbar)(() => ({
  width: "100%",
  color: "inherit",
}));

export function Header({ toggleMobileSidebar, pageTitle, user }: HeaderProps) {
  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={toggleMobileSidebar}
          sx={{ display: { lg: "none", xs: "inline-flex" }, mr: 1 }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>

        <Typography variant="h5" fontWeight={600} color="text.primary" noWrap>
          {pageTitle}
        </Typography>

        <Box flexGrow={1} />

        <Stack spacing={1} direction="row" alignItems="center">
          <ProfileMenu user={user} />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
}
