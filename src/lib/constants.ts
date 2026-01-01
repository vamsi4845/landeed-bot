import type { TaskStatus, TaskPriority } from "./types"

export const TASK_STATUSES = {
  todo: { label: "To Do", color: "bg-slate-500" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  done: { label: "Done", color: "bg-green-500" },
} as const satisfies Record<TaskStatus, { label: string; color: string }>

export const TASK_PRIORITIES = {
  low: { label: "Low", color: "bg-slate-400", textColor: "text-slate-400" },
  medium: { label: "Medium", color: "bg-blue-500", textColor: "text-blue-400" },
  high: { label: "High", color: "bg-orange-500", textColor: "text-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-red-400" },
} as const satisfies Record<TaskPriority, { label: string; color: string; textColor: string }>

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"]

