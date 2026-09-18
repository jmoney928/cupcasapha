import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

type Role = "client" | "staff" | "admin";

/**
 * Optimistic route gate (Next.js 16 "proxy", formerly middleware).
 * - unauthenticated → /login?next=…
 * - clients → blocked from /admin
 * - staff/admin → sent from /portal to /admin
 * Layouts re-check the profile row in the database, so a stale JWT can never widen access.
 */
export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxyClient(request);
  const { pathname, search } = request.nextUrl;

  // getClaims() verifies the JWT (locally with asymmetric keys, otherwise via the auth server) and refreshes cookies.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = ((claims?.app_metadata as { user_role?: Role } | undefined)?.user_role ?? "client") as Role;
  const signedIn = Boolean(claims?.sub);

  const wantsApp = pathname.startsWith("/portal") || pathname.startsWith("/admin");

  if (!signedIn && wantsApp) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL(role === "client" ? "/portal" : "/admin", request.url));
    }
    if (pathname.startsWith("/admin") && role === "client") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    if (pathname.startsWith("/portal") && role !== "client") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return getResponse();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/login"],
};
