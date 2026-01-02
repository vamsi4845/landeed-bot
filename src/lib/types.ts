export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export type TaskStatus = "todo" | "in_progress" | "done"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface CreateTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  parent_id?: string | null
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
}

export type TasksByStatus = {
  todo: Task[]
  in_progress: Task[]
  done: Task[]
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[]
}

export type GroupedTask = TaskWithSubtasks | Task

