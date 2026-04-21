import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const sessions = await prisma.focusSession.findMany({
    orderBy: { completedAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const date = body.date || new Date().toISOString().split("T")[0];
  const session = await prisma.focusSession.create({
    data: {
      date,
      duration: body.duration || 25,
    },
  });
  return NextResponse.json(session, { status: 201 });
}
