import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const date = searchParams.get("date");
  const yearOnly = searchParams.get("yearOnly");

  const where: Record<string, unknown> = {};
  if (date) {
    where.date = date;
  } else if (month && year) {
    const m = String(Number(month)).padStart(2, "0");
    where.date = { startsWith: `${year}-${m}` };
  } else if (yearOnly) {
    where.date = { startsWith: `${yearOnly}-` };
  }

  const sessions = await prisma.pilatesSession.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await prisma.pilatesSession.create({
    data: {
      date: body.date,
      time: body.time || null,
      type: body.type || "Mat",
      duration: Number(body.duration) || 60,
      intensity: body.intensity || "medium",
      focus: body.focus || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(session, { status: 201 });
}
