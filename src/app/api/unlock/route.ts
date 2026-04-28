import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const token = process.env.ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (key !== token) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Set long-lived auth cookie and redirect home
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("ws_auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return res;
}
