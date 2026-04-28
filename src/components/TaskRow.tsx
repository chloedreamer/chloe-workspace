"use client";

import { memo, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { Project } from "@/lib/constants";

interface Subtask { id: string; title: string; done: boolean; }
interface Task {
  id: string; title: string; description: string | null; status: string;
  priority: string; category: string; dueDate: string | null;
  subtasks: Subtask[]; _count: { comments: number };
}

const PRI_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
const PRI_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#9b6b6b" };

interface Props {
  task: Task;
  project: Project | undefined;
  onMarkDone: (id: string) => void;
  onMarkInProgress: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleSub: (subId: string, done: boolean) => void;
}

function TaskRowImpl({ task, project, onMarkDone, onMarkInProgress, onSelect, onToggleSub }: Props) {
  const [showSubs, setShowSubs] = useState(false);
  const doneS = task.subtasks.filter((s) => s.done).length;
  const totalS = task.subtasks.length;

  return (
    <div>
      <div className="flex items-start gap-3 py-3 px-4 hover:bg-rose-light transition rounded-lg">
        <button onClick={() => onMarkDone(task.id)} className="mt-0.5 flex-shrink-0 group" title="Mark done">
          {task.status === "in_progress" ? (
            <Clock className="w-[18px] h-[18px] text-blue-500 group-hover:text-green-500 transition" />
          ) : (
            <Circle className="w-[18px] h-[18px] text-rose-border group-hover:text-green-500 transition" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onSelect(task.id)}
            className="text-sm font-medium text-rose-dark text-left hover:text-rose-deep transition"
          >
            {task.title}
          </button>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {project && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${project.color}18`, color: project.color }}>
                {project.name}
              </span>
            )}
            <span className="text-xs" style={{ color: PRI_COLOR[task.priority] }}>{PRI_LABEL[task.priority]}</span>
            {totalS > 0 && (
              <button onClick={() => setShowSubs(!showSubs)} className="text-xs text-rose-muted hover:text-rose-deep">
                {doneS}/{totalS}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status !== "in_progress" && (
            <button onClick={() => onMarkInProgress(task.id)} className="text-xs text-rose-muted hover:text-blue-500 transition px-2 py-1 rounded hover:bg-blue-50">
              Start
            </button>
          )}
          {task.dueDate && (
            <span className="text-xs text-rose-muted">
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
      {showSubs && totalS > 0 && (
        <div className="ml-10 mb-2 space-y-1">
          {task.subtasks.map((s) => (
            <button
              key={s.id}
              onClick={() => onToggleSub(s.id, s.done)}
              className="flex items-center gap-2 w-full text-left py-1 px-2 rounded hover:bg-rose-light transition"
            >
              {s.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-deep" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-rose-border" />
              )}
              <span className={`text-xs ${s.done ? "line-through text-rose-muted" : "text-rose-dark"}`}>
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TaskRowImpl);
export type { Task, Subtask };
