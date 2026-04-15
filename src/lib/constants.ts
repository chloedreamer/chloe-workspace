export const PROJECTS = [
  { key: "actuarial", label: "Actuarial", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  { key: "wq", label: "WQ Brain", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  { key: "sp2", label: "SP2 Study", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-400" },
  { key: "timeless", label: "TIMELESS", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  { key: "general", label: "General", color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
];

export const COLUMNS = [
  { key: "todo", label: "To Do", headerColor: "bg-rose-light border-rose-border", dotColor: "bg-gray-400" },
  { key: "in_progress", label: "In Progress", headerColor: "bg-blue-50 border-blue-200", dotColor: "bg-blue-400" },
  { key: "done", label: "Done", headerColor: "bg-green-50 border-green-200", dotColor: "bg-green-400" },
];

export const PRIORITIES = [
  { key: "low", label: "Low", color: "text-rose-muted" },
  { key: "medium", label: "Medium", color: "text-yellow-600" },
  { key: "high", label: "High", color: "text-red-500" },
];

export function getProjectStyle(key: string) {
  return PROJECTS.find((p) => p.key === key) || PROJECTS[4];
}
