"use server"

import { createClient } from "@/lib/supabase/server"
import type { CreateTaskInput, UpdateTaskInput, Task } from "./types"
import { revalidatePath } from "next/cache"

export async function getTasks(): Promise<Task[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
}
export async function getTaskById(id: string): Promise<Task | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single()

    if (error) return null
    return data
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
    const supabase = await createClient()
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
    revalidatePath("/")
    return data
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
    const supabase = await createClient()
    const updateData: Partial<Task> = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.status !== undefined) updateData.status = input.status
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.due_date !== undefined) updateData.due_date = input.due_date
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath("/")
    return data
}

export async function deleteTask(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw new Error(error.message)
    revalidatePath("/")
}

export async function createSubtasks(
    parentId: string,
    subtasks: { title: string; description?: string }[]
): Promise<Task[]> {
    const supabase = await createClient()
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
    revalidatePath("/")
    return data
}

