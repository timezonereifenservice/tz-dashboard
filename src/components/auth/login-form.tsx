"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import CustomTextField from "@/components/ui/custom-text-field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Login failed");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb="5px">
            Email
          </Typography>
          <CustomTextField
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb="5px">
            Password
          </Typography>
          <CustomTextField
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button
          type="submit"
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
    </Box>
  );
}
