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
import type { TaskStatus, TaskPriority } from "@/lib/types";
import { COPILOT_ADDITIONAL_INSTRUCTIONS } from "@/lib/copilot-prompts";

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
        description: "The current list of tasks in the workspace",
        value: tasks || [],
    });

    useCopilotReadable({
        description: "Task statistics summary",
        value: {
            total: tasks?.length || 0,
            todo: tasks?.filter((t) => t.status === "todo").length || 0,
            inProgress: tasks?.filter((t) => t.status === "in_progress").length || 0,
            done: tasks?.filter((t) => t.status === "done").length || 0,
            highPriority:
                tasks?.filter((t) => t.priority === "high" || t.priority === "urgent")
                    .length || 0,
            overdue:
                tasks?.filter((t) => {
                    if (!t.due_date || t.status === "done") return false;
                    return new Date(t.due_date) < new Date();
                }).length || 0,
        },
    });

    useFrontendTool({
        name: "createTask",
        description:
            "Create a new task. Always confirm with the user before creating.",
        parameters: [
            {
                name: "title",
                type: "string",
                description: "The task title",
                required: true,
            },
            {
                name: "description",
                type: "string",
                description: "Optional task description",
            },
            {
                name: "priority",
                type: "string",
                description: "Priority: low, medium, high, or urgent",
            },
            {
                name: "status",
                type: "string",
                description: "Status: todo, in_progress, or done",
            },
            {
                name: "due_date",
                type: "string",
                description: "Optional due date in ISO format",
            },
        ],
        handler: async ({ title, description, priority, status, due_date }) => {
            try {
                await createTask.mutateAsync({
                    title,
                    description: description || null,
                    priority: (priority as TaskPriority) || "medium",
                    status: (status as TaskStatus) || "todo",
                    due_date: due_date || null,
                });
                toast.success(`Created task: ${title}`);
                return `Successfully created task: "${title}"`;
            } catch {
                toast.error("Failed to create task");
                return "Failed to create task";
            }
        },
    });

    useFrontendTool({
        name: "updateTask",
        description: "Update one or more fields of an existing task. Use findTask first to get the exact task ID. Only provide the fields you want to update. Ask for confirmation before updating.",
        parameters: [
            {
                name: "taskId",
                type: "string",
                description: "The ID of the task to update",
                required: true,
            },
            {
                name: "title",
                type: "string",
                description: "New task title (optional)",
            },
            {
                name: "description",
                type: "string",
                description: "New task description (optional, use null or empty string to clear)",
            },
            {
                name: "status",
                type: "string",
                description: "New status: todo, in_progress, or done (optional)",
            },
            {
                name: "priority",
                type: "string",
                description: "New priority: low, medium, high, or urgent (optional)",
            },
            {
                name: "due_date",
                type: "string",
                description: "New due date in ISO format YYYY-MM-DD or full ISO datetime (optional, use null or empty string to remove)",
            },
        ],
        handler: async ({
            taskId,
            title,
            description,
            status,
            priority,
            due_date,
        }) => {

            const task = tasks?.find((t) => t.id === taskId);
            if (!task) return "Task not found";

            const updates: {
                id: string;
                title?: string;
                description?: string | null;
                status?: TaskStatus;
                priority?: TaskPriority;
                due_date?: string | null;
            } = { id: taskId };

            if (title !== undefined) updates.title = title;
            if (description !== undefined) {
                updates.description = description === null || description === "" ? null : description;
            }
            const finalStatus = status;
            if (finalStatus !== undefined) {
                updates.status = finalStatus as TaskStatus;
            }
            const finalPriority = priority;
            if (finalPriority !== undefined) {
                updates.priority = finalPriority as TaskPriority;
            }
            const finalDueDate = due_date;
            if (finalDueDate !== undefined) {
                updates.due_date = finalDueDate === null || finalDueDate === "" || finalDueDate.toLowerCase() === "null"
                    ? null
                    : finalDueDate;
            }

            const updatedFields = Object.keys(updates).filter(k => k !== "id");
            if (updatedFields.length === 0) {
                return "No fields provided to update. Please specify at least one field to update.";
            }

            try {
                await updateTask.mutateAsync(updates);

                const fieldNames = updatedFields.map(f => {
                    if (f === "due_date") {
                        const dateStr = updates.due_date
                            ? new Date(updates.due_date).toLocaleDateString()
                            : "removed";
                        return `due date to ${dateStr}`;
                    }
                    if (f === "status") {
                        return `status to ${(updates.status || "").replace("_", " ")}`;
                    }
                    return `${f} to ${updates[f as keyof typeof updates]}`;
                }).join(", ");

                toast.success(`Updated "${task.title}": ${fieldNames}`);
                return `Successfully updated "${task.title}": ${fieldNames}`;
            } catch {
                toast.error("Failed to update task");
                return "Failed to update task";
            }
        },
    });

    useFrontendTool({
        name: "breakdownTask",
        description:
            "Break a task into smaller subtasks. Always show the subtasks to the user and ask for confirmation before creating them. Use findTask first to get the exact task ID, then pass that ID here.",
        parameters: [
            {
                name: "parent_task_id",
                type: "string",
                description: "The ID of the parent task to break down. Use findTask first to get the exact task ID.",
                required: true,
            },
            {
                name: "subtasks",
                type: "object[]",
                description: "Array of subtasks. Each subtask object must have a 'title' (string, required) and optionally a 'description' (string). Example: [{ title: 'Subtask 1', description: 'Optional description' }, { title: 'Subtask 2' }]",
                required: true,
                properties: [
                    {
                        name: "title",
                        type: "string",
                        description: "The title of the subtask",
                        required: true,
                    },
                    {
                        name: "description",
                        type: "string",
                        description: "Optional description for the subtask",
                        required: false,
                    },
                ],
            },
        ],
        handler: async (params) => {
            const { task_id, parent_task_id, subtasks } = params as {
                task_id?: string;
                parent_task_id?: string;
                subtasks: unknown;
            };

            const parentId = parent_task_id || task_id;

            if (!tasks || tasks.length === 0) {
                return "No tasks available. Please create a task first.";
            }

            if (!parentId || typeof parentId !== 'string') {
                const availableTasks = tasks
                    .slice(0, 10)
                    .map((t) => `"${t.title}" (ID: ${t.id})`)
                    .join("\n");
                return `Task ID is required. Available tasks:\n${availableTasks}\n\nUse the findTask tool first to locate the task and get its ID.`;
            }

            let parentTask = tasks.find((t) => t.id === parentId);

            if (!parentTask) {
                const searchTerm = parentId.toLowerCase().trim();
                const matchingTasks = tasks.filter((t) => {
                    const taskTitleLower = t.title.toLowerCase();
                    return taskTitleLower.includes(searchTerm);
                });

                if (matchingTasks.length === 0) {
                    const allTaskTitles = tasks
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Task not found with ID: "${parentId}". Please use findTask tool to locate the correct task and get its ID. Available tasks:\n${allTaskTitles}`;
                }

                if (matchingTasks.length > 1) {
                    const taskList = matchingTasks
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Multiple tasks found matching "${parentId}". Please use findTask to get the exact task ID from this list:\n${taskList}`;
                }

                parentTask = matchingTasks[0];
            }

            try {
                let subtaskArray: Array<{ title: string; description?: string }>;

                if (typeof subtasks === "string") {
                    subtaskArray = JSON.parse(subtasks);
                } else if (Array.isArray(subtasks)) {
                    subtaskArray = subtasks;
                } else {
                    return "Invalid subtasks format. Expected JSON string or array.";
                }

                if (!Array.isArray(subtaskArray) || subtaskArray.length === 0) {
                    return "Subtasks must be a non-empty array.";
                }

                const subtaskData = subtaskArray.map((s) => {
                    if (!s.title || typeof s.title !== "string") {
                        throw new Error("Each subtask must have a title string");
                    }
                    return {
                        title: s.title,
                        description: s.description || undefined,
                    };
                });

                await createSubtasks.mutateAsync({
                    parentId: parentTask.id,
                    subtasks: subtaskData,
                });

                toast.success(
                    `Created ${subtaskData.length} subtasks for "${parentTask.title}"`
                );
                return `Successfully created ${subtaskData.length} subtasks for "${parentTask.title}" (ID: ${parentTask.id})`;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error("Failed to create subtasks:", error);
                toast.error(`Failed to create subtasks: ${errorMessage}`);
                return `Failed to create subtasks: ${errorMessage}`;
            }
        },
    });

    useFrontendTool({
        name: "markTaskComplete",
        description:
            "Mark a task as complete. Ask for confirmation before marking.",
        parameters: [
            {
                name: "task_id",
                type: "string",
                description: "The ID of the task to mark complete",
                required: true,
            },
        ],
        handler: async ({ task_id: taskId }) => {
            const task = tasks?.find((t) => t.id === taskId);
            if (!task) return "Task not found";

            try {
                await updateTask.mutateAsync({
                    id: taskId,
                    status: "done",
                });
                toast.success(`Completed: "${task.title}"`);
                return `Successfully marked "${task.title}" as complete`;
            } catch {
                toast.error("Failed to mark task complete");
                return "Failed to mark task complete";
            }
        },
    });

    useFrontendTool({
        name: "deleteTask",
        description:
            "Delete a task. Always ask for confirmation before deleting. Can accept either a task ID or task title (partial match supported). Use findTask first to get the exact task ID if needed.",
        parameters: [
            {
                name: "task_id",
                type: "string",
                description: "The ID or title of the task to delete. If a title is provided, it will search for a matching task. Use findTask tool first to get the exact task ID.",
                required: true,
            },
        ],
        handler: async ({ task_id }) => {
            if (!task_id || typeof task_id !== 'string') {
                const availableTasks = tasks?.slice(0, 5).map((t) => `"${t.title}" (ID: ${t.id})`).join("\n") || "none";
                return `Task ID or title is required. Available tasks:\n${availableTasks}\n\nPlease use findTask first to locate the task, then use the exact task ID.`;
            }

            const taskId = task_id;

            if (!tasks || tasks.length === 0) {
                return "No tasks available to delete.";
            }

            let task = tasks.find((t) => t.id === taskId);

            if (!task) {
                const searchTerm = taskId.toLowerCase().trim();
                const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);

                const matchingTasks = tasks.filter((t) => {
                    const taskTitleLower = t.title.toLowerCase();
                    const exactMatch = taskTitleLower === searchTerm || taskTitleLower.includes(searchTerm);

                    if (exactMatch) return true;

                    if (searchWords.length > 1) {
                        const allWordsMatch = searchWords.every(word => taskTitleLower.includes(word));
                        if (allWordsMatch) return true;
                    }

                    return false;
                });

                if (matchingTasks.length === 0) {
                    const allTaskTitles = tasks
                        .slice(0, 10)
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Task not found: "${taskId}". Available tasks:\n${allTaskTitles}\n\nPlease use the exact task ID or a more specific title.`;
                }

                if (matchingTasks.length > 1) {
                    const taskList = matchingTasks
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Multiple tasks found matching "${taskId}". Please use the exact task ID from this list:\n${taskList}`;
                }

                task = matchingTasks[0];
            }

            try {
                await deleteTask.mutateAsync(task.id);
                toast.success(`Deleted task: "${task.title}"`);
                return `Successfully deleted task: "${task.title}"`;
            } catch {
                toast.error("Failed to delete task");
                return "Failed to delete task";
            }
        },
    });

    useFrontendTool({
        name: "findTask",
        description:
            "Find a task by title. Returns task details including ID, status, priority, and description.",
        parameters: [
            {
                name: "title",
                type: "string",
                description: "The title or partial title of the task to find (case-insensitive)",
                required: true,
            },
        ],
        handler: async ({ title }) => {
            if (!tasks || tasks.length === 0) {
                return "No tasks found in the workspace";
            }

            if (!title || typeof title !== 'string') {
                return "Task title is required to search for tasks.";
            }

            const searchTerm = title.toLowerCase().trim();
            const matchingTasks = tasks.filter((t) =>
                t.title.toLowerCase().includes(searchTerm)
            );

            if (matchingTasks.length === 0) {
                return `No tasks found matching "${title}"`;
            }

            if (matchingTasks.length === 1) {
                const task = matchingTasks[0];
                return `Found task: "${task.title}" (ID: ${task.id})\nStatus: ${task.status}\nPriority: ${task.priority}${task.description ? `\nDescription: ${task.description}` : ""}${task.due_date ? `\nDue Date: ${new Date(task.due_date).toLocaleDateString()}` : ""}`;
            }

            const taskList = matchingTasks
                .map(
                    (t) =>
                        `- "${t.title}" (ID: ${t.id}) - ${t.status} - ${t.priority}`
                )
                .join("\n");
            return `Found ${matchingTasks.length} tasks matching "${title}":\n${taskList}`;
        },
    });

    useCopilotChatSuggestions({
        suggestions: [
            {
                title: "Create a task",
                message: "Create a new task",
            },
            {
                title: "Update a task",
                message: "Update a task",
            },
            {
                title: "Delete a task",
                message: "Delete a task",
            },
        ],
    });
}

