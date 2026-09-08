"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { baselightTheme, plusJakarta } from "@/lib/theme/default-colors";

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={baselightTheme}>
      <CssBaseline />
      <div className={plusJakarta.className}>{children}</div>
    </ThemeProvider>
  );
}
