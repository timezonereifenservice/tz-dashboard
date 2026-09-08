"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import { IconSettings, IconLogout, IconUser } from "@tabler/icons-react";
import type { DashboardUser } from "@/lib/auth/types";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

type ProfileMenuProps = {
  user: DashboardUser;
};

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutPending, setLogoutPending] = useState(false);

  async function logout() {
    setLogoutPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLogoutPending(false);
      setAnchorEl(null);
    }
  }

  return (
    <Box>
      <IconButton
        size="large"
        color="inherit"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          ...(anchorEl && { color: "primary.main" }),
        }}
      >
        <Avatar sx={{ width: 35, height: 35, bgcolor: "primary.main", fontSize: 14 }}>
          {getInitials(user.email)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{ paper: { sx: { width: 220 } } }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.userType}
          </Typography>
        </Box>
        <MenuItem component={Link} href="/settings" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <IconSettings width={20} />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem disabled>
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <Box mt={1} py={1} px={2}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            disabled={logoutPending}
            onClick={logout}
            startIcon={<IconLogout width={18} />}
          >
            {logoutPending ? "Logging out…" : "Logout"}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}
