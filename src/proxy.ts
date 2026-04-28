import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get("ws_auth")?.value;
  const pin = process.env.ACCESS_PIN;

  // No PIN configured → allow (safety net during local dev)
  if (!pin) return NextResponse.next();

  const path = request.nextUrl.pathname;

  // Always allow login page and login API
  if (path === "/login" || path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Authenticated → renew sliding cookie
  if (cookie === pin) {
    const res = NextResponse.next();
    res.cookies.set("ws_auth", pin, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    });
    return res;
  }

  // Not authenticated → redirect to login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
