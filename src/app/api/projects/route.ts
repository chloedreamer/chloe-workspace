import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const count = await prisma.project.count();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      key,
      color: body.color || "#c8a0a0",
      icon: body.icon || "folder",
      order: count,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
