import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.date !== undefined) data.date = body.date;
  if (body.time !== undefined) data.time = body.time || null;
  if (body.type !== undefined) data.type = body.type;
  if (body.duration !== undefined) data.duration = Number(body.duration);
  if (body.intensity !== undefined) data.intensity = body.intensity;
  if (body.focus !== undefined) data.focus = body.focus || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const session = await prisma.pilatesSession.update({ where: { id }, data });
  return NextResponse.json(session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.pilatesSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
