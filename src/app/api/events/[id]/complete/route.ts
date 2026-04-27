import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let completed: string[] = [];
  try {
    completed = JSON.parse(event.completedDates);
    if (!Array.isArray(completed)) completed = [];
  } catch {
    completed = [];
  }

  if (completed.includes(date)) {
    completed = completed.filter((d) => d !== date);
  } else {
    completed.push(date);
  }

  const updated = await prisma.event.update({
    where: { id },
    data: { completedDates: JSON.stringify(completed) },
  });
  return NextResponse.json(updated);
}
