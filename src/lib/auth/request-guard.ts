import { NextRequest, NextResponse } from "next/server";

/**
 * Soft CSRF guard for cookie-authenticated mutating requests.
 * Browsers send Origin on cross-site POSTs; same-site SPA calls match host.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser clients / same-origin navigations may omit Origin.
    // Still require Sec-Fetch-Site when present and clearly cross-site.
    const fetchSite = req.headers.get("sec-fetch-site");
    if (fetchSite === "cross-site") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
    return null;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const requestHost = req.headers.get("host");
  if (!requestHost || originHost !== requestHost) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  return null;
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
