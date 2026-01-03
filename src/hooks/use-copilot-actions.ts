"use client";

import { useCopilotReadable, useCopilotAdditionalInstructions, useFrontendTool, useCopilotChatSuggestions } from "@copilotkit/react-core";
import {
    useTasks,
    useCreateTask,
    useUpdateTask,
    useCreateSubtasks,
    useDeleteTask,
} from "@/hooks/use-tasks";
import { toast } from "sonner";
import type { TaskStatus, TaskPriority, Task } from "@/lib/types";
import { COPILOT_ADDITIONAL_INSTRUCTIONS } from "@/lib/copilot-prompts";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

function normalizeStatus(value: string | undefined): TaskStatus | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, "_");
    if (normalized === "in_progress" || normalized === "inprogress") return "in_progress";
    return VALID_STATUSES.includes(normalized as TaskStatus) ? (normalized as TaskStatus) : undefined;
}

function normalizePriority(value: string | undefined): TaskPriority | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase().trim();
    return VALID_PRIORITIES.includes(normalized as TaskPriority) ? (normalized as TaskPriority) : undefined;
}

function normalizeDate(value: string | undefined | null): string | null {
    if (!value || value === "null" || value === "") return null;
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split("T")[0];
    } catch {
        return null;
    }
}

function findTaskByIdOrTitle(tasks: Task[] | undefined, identifier: string): { task: Task | null; error: string | null; suggestions?: string } {
    if (!tasks || tasks.length === 0) {
        return { task: null, error: "No tasks available." };
    }

    const exactMatch = tasks.find((t) => t.id === identifier);
    if (exactMatch) return { task: exactMatch, error: null };

    const searchTerm = identifier.toLowerCase().trim();
    const matches = tasks.filter((t) => t.title.toLowerCase().includes(searchTerm));

    if (matches.length === 0) {
        const available = tasks.slice(0, 5).map((t) => `• "${t.title}" (ID: ${t.id})`).join("\n");
        return { task: null, error: `No task found matching "${identifier}".`, suggestions: available };
    }

    if (matches.length === 1) return { task: matches[0], error: null };

    const list = matches.map((t) => `• "${t.title}" (ID: ${t.id})`).join("\n");
    return { task: null, error: `Multiple tasks match "${identifier}". Use findTask to get the exact ID:\n${list}` };
}

export function useCopilotActions() {
    const { data: tasks } = useTasks();
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const createSubtasks = useCreateSubtasks();
    const deleteTask = useDeleteTask();

    useCopilotAdditionalInstructions({
        instructions: COPILOT_ADDITIONAL_INSTRUCTIONS,
    });

    useCopilotReadable({
        description: "Current tasks in the workspace with their IDs, titles, statuses, priorities, and due dates",
        value: tasks?.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
            has_subtasks: tasks.some((s) => s.parent_id === t.id),
            is_subtask: !!t.parent_id,
        })) || [],
    });

    useCopilotReadable({
        description: "Task statistics summary",
        value: {
            total: tasks?.length || 0,
            todo: tasks?.filter((t) => t.status === "todo").length || 0,
            inProgress: tasks?.filter((t) => t.status === "in_progress").length || 0,
            done: tasks?.filter((t) => t.status === "done").length || 0,
            highPriority: tasks?.filter((t) => t.priority === "high" || t.priority === "urgent").length || 0,
            overdue: tasks?.filter((t) => {
                if (!t.due_date || t.status === "done") return false;
                return new Date(t.due_date) < new Date();
            }).length || 0,
        },
    });

    useFrontendTool({
        name: "findTask",
        description: "Find a task by title to get its ID. ALWAYS use this before updateTask, deleteTask, markTaskComplete, or breakdownTask.",
        parameters: [
            {
                name: "searchTerm",
                type: "string",
                description: "The title or partial title to search for (case-insensitive)",
                required: true,
            },
        ],
        handler: async (params) => {
            // console.log(" findTask params", params);
            const { searchTerm } = params;
            if (!searchTerm || typeof searchTerm !== "string") {
                return "Search term is required.";
            }

            if (!tasks || tasks.length === 0) {
                return "No tasks found in the workspace.";
            }

            const term = searchTerm.toLowerCase().trim();
            const matches = tasks.filter((t) => t.title.toLowerCase().includes(term));

            if (matches.length === 0) {
                return `No tasks found matching "${searchTerm}".`;
            }

            if (matches.length === 1) {
                const t = matches[0];
                return `Found: "${t.title}"\nID: ${t.id}\nStatus: ${t.status}\nPriority: ${t.priority}${t.due_date ? `\nDue: ${new Date(t.due_date).toLocaleDateString()}` : ""}${t.description ? `\nDescription: ${t.description}` : ""}`;
            }

            const list = matches.map((t) => `• "${t.title}" (ID: ${t.id}) - ${t.status}, ${t.priority}`).join("\n");
            return `Found ${matches.length} tasks:\n${list}\n\nUse the exact ID for operations.`;
        },
    });

    useFrontendTool({
        name: "createTask",
        description: "Create a new task. Confirm with user before creating.",
        parameters: [
            {
                name: "title",
                type: "string",
                description: "Task title (required)",
                required: true,
            },
            {
                name: "description",
                type: "string",
                description: "Task description (optional)",
            },
            {
                name: "priority",
                type: "string",
                description: "One of: low, medium, high, urgent. Default: medium",
            },
            {
                name: "status",
                type: "string",
                description: "One of: todo, in_progress, done. Default: todo",
            },
            {
                name: "due_date",
                type: "string",
                description: "Due date in YYYY-MM-DD format (optional)",
            },
        ],
        handler: async (params) => {
            // console.log(" createTask params", params);
            const { title, description, priority, status, due_date } = params;
            if (!title || typeof title !== "string" || title.trim() === "") {
                return "Task title is required.";
            }

            const validatedPriority = normalizePriority(priority) || "medium";
            const validatedStatus = normalizeStatus(status) || "todo";
            const validatedDate = normalizeDate(due_date);

            try {
                await createTask.mutateAsync({
                    title: title.trim(),
                    description: description?.trim() || null,
                    priority: validatedPriority,
                    status: validatedStatus,
                    due_date: validatedDate,
                });
                toast.success(`Created: ${title}`);
                return `Created task "${title}" (status: ${validatedStatus}, priority: ${validatedPriority}${validatedDate ? `, due: ${validatedDate}` : ""})`;
            } catch {
                toast.error("Failed to create task");
                return "Failed to create task. Please try again.";
            }
        },
    });

    useFrontendTool({
        name: "updateTask",
        description: "Update an existing task. Use findTask first to get the task ID. Only provide fields you want to change.",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The task ID (UUID) from findTask. Required.",
                required: true,
            },
            {
                name: "title",
                type: "string",
                description: "New title (optional)",
            },
            {
                name: "description",
                type: "string",
                description: "New description. Use empty string to clear. (optional)",
            },
            {
                name: "status",
                type: "string",
                description: "New status. One of: todo, in_progress, done (optional)",
            },
            {
                name: "priority",
                type: "string",
                description: "New priority. One of: low, medium, high, urgent (optional)",
            },
            {
                name: "due_date",
                type: "string",
                description: "New due date in YYYY-MM-DD format. Use empty string to remove. (optional)",
            },
        ],
        handler: async (params) => {
            // console.log(" updateTask params", params);
            const { id, title, description, status, priority, due_date } = params;
            const { task, error, suggestions } = findTaskByIdOrTitle(tasks, id);
            if (error) {
                return suggestions ? `${error}\n\nAvailable tasks:\n${suggestions}` : error;
            }
            if (!task) return "Task not found.";

            const updates: { id: string; title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority; due_date?: string | null } = { id: task.id };
            const changes: string[] = [];

            if (title !== undefined && title !== "") {
                updates.title = title.trim();
                changes.push(`title → "${title.trim()}"`);
            }

            if (description !== undefined) {
                updates.description = description === "" ? null : description.trim();
                changes.push(description === "" ? "description cleared" : `description updated`);
            }

            if (status !== undefined) {
                const validStatus = normalizeStatus(status);
                if (validStatus) {
                    updates.status = validStatus;
                    changes.push(`status → ${validStatus.replace("_", " ")}`);
                }
            }

            if (priority !== undefined) {
                const validPriority = normalizePriority(priority);
                if (validPriority) {
                    updates.priority = validPriority;
                    changes.push(`priority → ${validPriority}`);
                }
            }

            if (due_date !== undefined) {
                if (due_date === "" || due_date.toLowerCase() === "null") {
                    updates.due_date = null;
                    changes.push("due date removed");
                } else {
                    const validDate = normalizeDate(due_date);
                    if (validDate) {
                        updates.due_date = validDate;
                        changes.push(`due date → ${validDate}`);
                    }
                }
            }

            if (changes.length === 0) {
                return "No valid fields provided to update.";
            }

            try {
                await updateTask.mutateAsync(updates);
                toast.success(`Updated: ${task.title}`);
                return `Updated "${task.title}": ${changes.join(", ")}`;
            } catch {
                toast.error("Failed to update task");
                return "Failed to update task. Please try again.";
            }
        },
    });

    useFrontendTool({
        name: "markTaskComplete",
        description: "Mark a task as done. Use findTask first to get the task ID.",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The task ID (UUID) from findTask",
                required: true,
            },
        ],
        handler: async (params) => {
            // console.log(" markTaskComplete params", params);
            const { id } = params;
            const { task, error, suggestions } = findTaskByIdOrTitle(tasks, id);
            if (error) {
                return suggestions ? `${error}\n\nAvailable tasks:\n${suggestions}` : error;
            }
            if (!task) return "Task not found.";

            if (task.status === "done") {
                return `"${task.title}" is already complete.`;
            }

            try {
                await updateTask.mutateAsync({ id: task.id, status: "done" });
                toast.success(`Completed: ${task.title}`);
                return `Marked "${task.title}" as complete.`;
            } catch {
                toast.error("Failed to complete task");
                return "Failed to mark task complete.";
            }
        },
    });

    useFrontendTool({
        name: "deleteTask",
        description: "Delete a task. Use findTask first to get the task ID. Always confirm before deleting.",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The task ID (UUID) from findTask",
                required: true,
            },
        ],
        handler: async (params) => {
            // console.log(" deleteTask params", params);
            const { id } = params;
            const { task, error, suggestions } = findTaskByIdOrTitle(tasks, id);
            if (error) {
                return suggestions ? `${error}\n\nAvailable tasks:\n${suggestions}` : error;
            }
            if (!task) return "Task not found.";

            try {
                await deleteTask.mutateAsync(task.id);
                toast.success(`Deleted: ${task.title}`);
                return `Deleted "${task.title}".`;
            } catch {
                toast.error("Failed to delete task");
                return "Failed to delete task.";
            }
        },
    });

    useFrontendTool({
        name: "breakdownTask",
        description: "Break a task into subtasks. Use findTask first to get the task ID. Confirm subtasks with user before creating.",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The task ID (UUID) from findTask",
                required: true,
            },
            {
                name: "subtasks",
                type: "string",
                description: "JSON array of subtask objects. Each object must have 'title' (required) and 'description' (optional). Example: [{\"title\": \"Design UI\", \"description\": \"Create mockups\"}, {\"title\": \"Write tests\"}]",
                required: true,
            },
        ],
        handler: async (params) => {
            // console.log(" breakdownTask params", params);
            const { id, subtasks: subtasksInput } = params;
            const { task: parentTask, error, suggestions } = findTaskByIdOrTitle(tasks, id);
            if (error) {
                return suggestions ? `${error}\n\nAvailable tasks:\n${suggestions}` : error;
            }
            if (!parentTask) return "Parent task not found.";

            if (!subtasksInput) {
                return "Subtasks are required. Provide as JSON array of objects with title and optional description.";
            }

            let subtaskData: Array<{ title: string; description?: string }> = [];

            try {
                const input = typeof subtasksInput === "string" ? subtasksInput : JSON.stringify(subtasksInput);
                const parsed = JSON.parse(input);

                if (!Array.isArray(parsed)) {
                    return "Subtasks must be a JSON array. Example: [{\"title\": \"Task 1\"}, {\"title\": \"Task 2\", \"description\": \"Details\"}]";
                }

                subtaskData = parsed
                    .filter((item) => item && typeof item.title === "string" && item.title.trim())
                    .map((item) => ({
                        title: item.title.trim(),
                        description: item.description?.trim() || undefined,
                    }));
            } catch {
                return "Invalid JSON format. Provide subtasks as: [{\"title\": \"Task 1\"}, {\"title\": \"Task 2\", \"description\": \"Details\"}]";
            }

            if (subtaskData.length === 0) {
                return "No valid subtasks provided. Each subtask must have a title.";
            }

            try {
                await createSubtasks.mutateAsync({
                    parentId: parentTask.id,
                    subtasks: subtaskData,
                });
                toast.success(`Created ${subtaskData.length} subtasks`);
                const subtaskList = subtaskData.map((s) => `• ${s.title}${s.description ? ` - ${s.description}` : ""}`).join("\n");
                return `Created ${subtaskData.length} subtasks for "${parentTask.title}":\n${subtaskList}`;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Unknown error";
                toast.error("Failed to create subtasks");
                return `Failed to create subtasks: ${msg}`;
            }
        },
    });

    useCopilotChatSuggestions({
        suggestions: [
            { title: "Create a task", message: "Create a new task" },
            { title: "Summarize my tasks", message: "Summarize my current tasks" },
            { title: "Update a task", message: "Update a task" },
        ],
    });
}