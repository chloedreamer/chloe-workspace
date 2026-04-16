import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const subtask = await prisma.subtask.create({
    data: {
      title: body.title,
      taskId: id,
      order: body.order || 0,
    },
  });
  return NextResponse.json(subtask, { status: 201 });
}
