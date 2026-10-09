import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/config";

/**
 * Optimistic auth gate (Next.js 16 proxy).
 * Cookie presence only — real session + permission checks stay in layouts/pages/APIs.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/images/") ||
    pathname.startsWith("/api/blog-images/");

  if (isPublic) {
    return NextResponse.next();
  }

  const hasAccessCookie = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
  );

  if (!hasAccessCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip static assets and Next internals.
     * Keep API + app routes covered.
     */
    "/((?!_next/static|_next/image|favicon.ico|projects/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
