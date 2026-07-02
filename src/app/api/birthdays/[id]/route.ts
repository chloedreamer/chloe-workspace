import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.date !== undefined) data.date = body.date;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.color !== undefined) data.color = body.color;

  const birthday = await prisma.birthday.update({ where: { id }, data });
  return NextResponse.json(birthday);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.birthday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
