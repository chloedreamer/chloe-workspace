import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.done !== undefined) data.done = body.done;
  if (body.order !== undefined) data.order = body.order;
  if (body.pomodoroEstimate !== undefined) data.pomodoroEstimate = Math.max(0, Number(body.pomodoroEstimate) || 0);
  if (body.pomodoroSpent !== undefined) data.pomodoroSpent = Math.max(0, Number(body.pomodoroSpent) || 0);

  // Single transaction: update subtask + cascade parent task status
  const result = await prisma.$transaction(async (tx) => {
    const subtask = await tx.subtask.update({ where: { id }, data });

    if (body.done !== undefined) {
      const siblings = await tx.subtask.findMany({
        where: { taskId: subtask.taskId },
        select: { done: true },
      });
      const allDone = siblings.length > 0 && siblings.every((s) => s.done);
      const someDone = siblings.some((s) => s.done);

      const parent = await tx.task.findUnique({
        where: { id: subtask.taskId },
        select: { status: true },
      });

      let newStatus: string | null = null;
      if (allDone && parent?.status !== "done") newStatus = "done";
      else if (!allDone && someDone && parent?.status === "done") newStatus = "in_progress";
      else if (!allDone && !someDone && parent?.status === "done") newStatus = "todo";

      if (newStatus) {
        await tx.task.update({ where: { id: subtask.taskId }, data: { status: newStatus } });
      }
    }
    return subtask;
  });

  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
