import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const intention = await prisma.dailyIntention.findUnique({ where: { date } });
  return NextResponse.json(intention || { date, items: "[]", reflection: null });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const body = await req.json();

  const intention = await prisma.dailyIntention.upsert({
    where: { date },
    update: {
      items: typeof body.items === "string" ? body.items : JSON.stringify(body.items),
      reflection: body.reflection !== undefined ? body.reflection : undefined,
    },
    create: {
      date,
      items: typeof body.items === "string" ? body.items : JSON.stringify(body.items || []),
      reflection: body.reflection || null,
    },
  });
  return NextResponse.json(intention);
}
