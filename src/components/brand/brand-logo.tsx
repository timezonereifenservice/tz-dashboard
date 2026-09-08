import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { brand } from "@/lib/brand";

type BrandLogoProps = {
  href?: string;
  variant?: "full" | "mark";
  height?: number;
  showTagline?: boolean;
};

export function BrandLogo({
  href = "/",
  variant = "full",
  height = 40,
  showTagline = false,
}: BrandLogoProps) {
  const src = variant === "full" ? brand.logoSrc : brand.markSrc;

  const content = (
    <Box display="flex" flexDirection="column" alignItems={variant === "full" ? "flex-start" : "center"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={brand.name}
        height={height}
        style={{ height, width: "auto", maxWidth: "100%", display: "block" }}
      />
      {showTagline ? (
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          {brand.tagline}
        </Typography>
      ) : null}
    </Box>
  );

  if (!href) return content;

  return (
    <Link href={href} style={{ textDecoration: "none", display: "inline-flex" }}>
      {content}
    </Link>
  );
}
