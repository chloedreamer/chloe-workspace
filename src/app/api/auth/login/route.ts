import { NextRequest, NextResponse } from "next/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const expected = process.env.ACCESS_PIN;

  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (typeof pin !== "string" || pin !== expected) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ws_auth", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return res;
}
