import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get("ws_auth")?.value;
  const token = process.env.ACCESS_TOKEN;

  // No token configured → allow (safety net during local dev)
  if (!token) return NextResponse.next();

  // Already authenticated → renew cookie on every request (sliding expiration)
  if (cookie === token) {
    const res = NextResponse.next();
    res.cookies.set("ws_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    });
    return res;
  }

  // Allow unlock endpoint
  if (request.nextUrl.pathname.startsWith("/api/unlock")) {
    return NextResponse.next();
  }

  // Block everything else: return 404 to avoid leaking app existence
  return new NextResponse("Not Found", { status: 404 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
