import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const birthdays = await prisma.birthday.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(birthdays);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.date) {
    return NextResponse.json({ error: "name + date required" }, { status: 400 });
  }
  const birthday = await prisma.birthday.create({
    data: {
      name: body.name,
      date: body.date,
      notes: body.notes || null,
      color: body.color || "#c8a0a0",
    },
  });
  return NextResponse.json(birthday, { status: 201 });
}
