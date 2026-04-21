export interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  icon: string;
  order: number;
  archived: boolean;
}

export const COLUMNS = [
  { key: "todo", label: "To Do", headerColor: "bg-rose-light/40", dotColor: "bg-gray-400" },
  { key: "in_progress", label: "In Progress", headerColor: "bg-rose-light/40", dotColor: "bg-blue-400" },
  { key: "done", label: "Done", headerColor: "bg-rose-light/40", dotColor: "bg-green-400" },
];

export const PRIORITIES = [
  { key: "low", label: "Low", color: "text-rose-muted" },
  { key: "medium", label: "Medium", color: "text-yellow-600" },
  { key: "high", label: "High", color: "text-red-500" },
];

export const COLOR_OPTIONS = [
  "#3b82f6", "#a855f7", "#22c55e", "#f97316", "#ef4444",
  "#ec4899", "#14b8a6", "#6366f1", "#f59e0b", "#c8a0a0",
];

export function getProjectBadgeStyle(color: string) {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}30`,
  };
}
