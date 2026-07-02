import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearMonth = searchParams.get("yearMonth");
  if (!yearMonth) {
    const goals = await prisma.pilatesGoal.findMany({ orderBy: { yearMonth: "desc" } });
    return NextResponse.json(goals);
  }
  const goal = await prisma.pilatesGoal.findUnique({ where: { yearMonth } });
  return NextResponse.json(goal || { yearMonth, target: 16 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.yearMonth) return NextResponse.json({ error: "yearMonth required" }, { status: 400 });
  const target = Math.max(1, Math.min(60, Number(body.target) || 16));
  const goal = await prisma.pilatesGoal.upsert({
    where: { yearMonth: body.yearMonth },
    update: { target },
    create: { yearMonth: body.yearMonth, target },
  });
  return NextResponse.json(goal);
}
