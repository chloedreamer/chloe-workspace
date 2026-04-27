import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (date) where.date = date;
  if (category) where.category = category;

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: date ? undefined : 100,
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const note = await prisma.note.create({
    data: {
      date: body.date || new Date().toISOString().split("T")[0],
      title: body.title || "",
      content: body.content || "",
      category: body.category || "general",
      pinned: body.pinned || false,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
