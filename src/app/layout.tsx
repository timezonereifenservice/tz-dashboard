import type { Metadata } from "next";
import { Toaster } from "sonner";
import { MuiThemeProvider } from "@/providers/mui-theme-provider";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: "Unified dashboard for TZ Transport, Take & Bring, and TZ Reifenservice.",
  applicationName: brand.name,
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/brand/consolehub-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/consolehub-mark.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </MuiThemeProvider>
      </body>
    </html>
  );
}
