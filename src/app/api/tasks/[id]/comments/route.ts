import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const comment = await prisma.comment.create({
    data: {
      content: body.content,
      taskId: id,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}
