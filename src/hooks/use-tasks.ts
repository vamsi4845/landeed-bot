"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { Task, CreateTaskInput, UpdateTaskInput, TasksByStatus, GroupedTask } from "@/lib/types"

const TASKS_KEY = ["tasks"]

const DEMO_TASKS: Task[] = [
    {
        id: "demo-1",
        title: "Set up Supabase database",
        description: "Create a Supabase project and run the schema.sql file to set up the tasks table.",
        status: "todo",
        priority: "high",
        due_date: null,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "demo-2",
        title: "Configure environment variables",
        description: "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and GOOGLE_API_KEY to your .env.local file.",
        status: "todo",
        priority: "urgent",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "demo-3",
        title: "Try the AI Copilot",
        description: "Press Cmd+K or click the chat icon to open the AI assistant. Ask it to summarize tasks or create new ones!",
        status: "in_progress",
        priority: "medium",
        due_date: null,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

export function useTasks() {
    return useQuery({
        queryKey: TASKS_KEY,
        queryFn: async (): Promise<Task[]> => {
            if (!isSupabaseConfigured()) {
                return DEMO_TASKS
            }

            const supabase = createClient()
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw new Error(error.message)
            return data || []
        },
    })
}

export function useTasksByStatus() {
    const { data: tasks, ...rest } = useTasks()

    const tasksByStatus: TasksByStatus = {
        todo: [],
        in_progress: [],
        done: [],
    }

    if (tasks) {
        tasks.map((task) => {
            tasksByStatus[task.status].push(task)
        })
    }

    return { data: tasksByStatus, tasks, ...rest }
}

export function useGroupedTasksByStatus() {
    const { data: tasks, ...rest } = useTasks()

    const groupedTasksByStatus: Record<"todo" | "in_progress" | "done", GroupedTask[]> = {
        todo: [],
        in_progress: [],
        done: [],
    }

    if (tasks) {
        const parentTasks = tasks.filter((task) => !task.parent_id)
        const subtasksMap = new Map<string, Task[]>()

        tasks.forEach((task) => {
            if (task.parent_id) {
                const existing = subtasksMap.get(task.parent_id) || []
                existing.push(task)
                subtasksMap.set(task.parent_id, existing)
            }
        })

        parentTasks.forEach((parentTask) => {
            const subtasks = subtasksMap.get(parentTask.id) || []
            const groupedTask: GroupedTask = subtasks.length > 0
                ? { ...parentTask, subtasks }
                : parentTask

            groupedTasksByStatus[parentTask.status].push(groupedTask)
        })
    }

    return { data: groupedTasksByStatus, tasks, ...rest }
}

export function useCreateTask() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateTaskInput): Promise<Task> => {
            if (!isSupabaseConfigured()) {
                const newTask: Task = {
                    id: `demo-${Date.now()}`,
                    title: input.title,
                    description: input.description || null,
                    status: input.status || "todo",
                    priority: input.priority || "medium",
                    due_date: input.due_date || null,
                    parent_id: input.parent_id || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
                queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => [newTask, ...(old || [])])
                return newTask
            }

            const supabase = createClient()
            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    title: input.title,
                    description: input.description || null,
                    status: input.status || "todo",
                    priority: input.priority || "medium",
                    due_date: input.due_date || null,
                    parent_id: input.parent_id || null,
                })
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data
        },
        onSuccess: () => {
            if (isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey: TASKS_KEY })
            }
        },
    })
}

export function useUpdateTask() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: UpdateTaskInput): Promise<Task> => {
            if (!isSupabaseConfigured()) {
                let updatedTask: Task | null = null
                queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
                    (old || []).map((task) => {
                        if (task.id === input.id) {
                            updatedTask = {
                                ...task,
                                ...(input.title !== undefined && { title: input.title }),
                                ...(input.description !== undefined && { description: input.description }),
                                ...(input.status !== undefined && { status: input.status }),
                                ...(input.priority !== undefined && { priority: input.priority }),
                                ...(input.due_date !== undefined && { due_date: input.due_date }),
                                updated_at: new Date().toISOString(),
                            }
                            return updatedTask
                        }
                        return task
                    })
                )
                if (!updatedTask) throw new Error("Task not found")
                return updatedTask
            }

            const supabase = createClient()
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            }

            if (input.title !== undefined) updateData.title = input.title
            if (input.description !== undefined) updateData.description = input.description
            if (input.status !== undefined) updateData.status = input.status
            if (input.priority !== undefined) updateData.priority = input.priority
            if (input.due_date !== undefined) updateData.due_date = input.due_date

            const { data, error } = await supabase
                .from("tasks")
                .update(updateData)
                .eq("id", input.id)
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data
        },
        onSuccess: () => {
            if (isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey: TASKS_KEY })
            }
        },
    })
}

export function useDeleteTask() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            if (!isSupabaseConfigured()) {
                queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
                    (old || []).filter((task) => task.id !== id && task.parent_id !== id)
                )
                return
            }

            const supabase = createClient()
            const { error } = await supabase.from("tasks").delete().eq("id", id)
            if (error) throw new Error(error.message)
        },
        onSuccess: () => {
            if (isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey: TASKS_KEY })
            }
        },
    })
}

export function useCreateSubtasks() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            parentId,
            subtasks,
        }: {
            parentId: string
            subtasks: { title: string; description?: string }[]
        }): Promise<Task[]> => {
            if (!isSupabaseConfigured()) {
                const newSubtasks: Task[] = subtasks.map((subtask, index) => ({
                    id: `demo-subtask-${Date.now()}-${index}`,
                    title: subtask.title,
                    description: subtask.description || null,
                    status: "todo" as const,
                    priority: "medium" as const,
                    due_date: null,
                    parent_id: parentId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }))
                queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => [...newSubtasks, ...(old || [])])
                return newSubtasks
            }

            const supabase = createClient()
            const { data, error } = await supabase
                .from("tasks")
                .insert(
                    subtasks.map((subtask) => ({
                        title: subtask.title,
                        description: subtask.description || null,
                        status: "todo" as const,
                        priority: "medium" as const,
                        parent_id: parentId,
                    }))
                )
                .select()

            if (error) throw new Error(error.message)
            return data
        },
        onSuccess: () => {
            if (isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey: TASKS_KEY })
            }
        },
    })
}
