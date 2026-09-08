import type { Metadata } from "next";
import { MuiThemeProvider } from "@/providers/mui-theme-provider";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: brand.tagline,
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
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  );
}
