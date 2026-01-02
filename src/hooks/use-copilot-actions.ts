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
    console.log(tasks)
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
                name: "dueDate",
                type: "string",
                description: "Optional due date in ISO format",
            },
        ],
        handler: async ({ title, description, priority, status, dueDate }) => {
            try {
                await createTask.mutateAsync({
                    title,
                    description: description || null,
                    priority: (priority as TaskPriority) || "medium",
                    status: (status as TaskStatus) || "todo",
                    due_date: dueDate || null,
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
        name: "updateTaskStatus",
        description:
            "Update the status of a task. Ask for confirmation before updating.",
        parameters: [
            {
                name: "taskId",
                type: "string",
                description: "The ID of the task to update",
                required: true,
            },
            {
                name: "newStatus",
                type: "string",
                description: "New status: todo, in_progress, or done",
                required: true,
            },
        ],
        handler: async ({ taskId, newStatus }) => {
            const task = tasks?.find((t) => t.id === taskId);
            if (!task) return "Task not found";

            try {
                await updateTask.mutateAsync({
                    id: taskId,
                    status: newStatus as TaskStatus,
                });
                toast.success(
                    `Updated "${task.title}" to ${newStatus.replace("_", " ")}`
                );
                return `Successfully updated "${task.title}" to ${newStatus}`;
            } catch {
                toast.error("Failed to update task");
                return "Failed to update task";
            }
        },
    });

    useFrontendTool({
        name: "updateTaskPriority",
        description: "Update the priority of a task",
        parameters: [
            {
                name: "taskId",
                type: "string",
                description: "The ID of the task to update",
                required: true,
            },
            {
                name: "newPriority",
                type: "string",
                description: "New priority: low, medium, high, or urgent",
                required: true,
            },
        ],
        handler: async ({ taskId, newPriority }) => {
            const task = tasks?.find((t) => t.id === taskId);
            if (!task) return "Task not found";

            try {
                await updateTask.mutateAsync({
                    id: taskId,
                    priority: newPriority as TaskPriority,
                });
                toast.success(`Updated "${task.title}" priority to ${newPriority}`);
                return `Successfully updated "${task.title}" priority to ${newPriority}`;
            } catch {
                toast.error("Failed to update task priority");
                return "Failed to update task priority";
            }
        },
    });

    useFrontendTool({
        name: "breakdownTask",
        description:
            "Break a task into smaller subtasks. Always show the subtasks to the user and ask for confirmation before creating them. Provide the task title (can be partial match, e.g., 'api documentation' will match 'Write API documentation'). Use the findTask tool if needed to locate the exact task.",
        parameters: [
            {
                name: "taskTitle",
                type: "string",
                description: "The title of the task to break down. Can be a partial match (e.g., 'api documentation' will match 'Write API documentation'). If unsure, use findTask first to get the exact title.",
                required: true,
            },
            {
                name: "subtasks",
                type: "object[]",
                description: "Array of subtasks with title and optional description",
                required: true,
            },
        ],
        handler: async ({ taskTitle, subtasks }) => {
            console.log("breakdownTask called with:", { taskTitle, subtasks, tasksCount: tasks?.length });

            if (!tasks || tasks.length === 0) {
                return "No tasks available. Please create a task first.";
            }

            if (!taskTitle || taskTitle.trim() === "") {
                const availableTasks = tasks
                    .slice(0, 10)
                    .map((t) => `"${t.title}" (ID: ${t.id})`)
                    .join("\n");
                return `Task title is required. Please provide the task title. Available tasks:\n${availableTasks}\n\nUse the findTask tool first to locate the task you want to break down.`;
            }

            const searchTerm = taskTitle.toLowerCase().trim();
            const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);

            let parentTask = tasks.find((t) => t.id === taskTitle);

            if (!parentTask) {
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
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Task not found: "${taskTitle}". Please use findTask tool to locate the correct task, or use one of these available tasks:\n${allTaskTitles}`;
                }

                if (matchingTasks.length > 1) {
                    const taskList = matchingTasks
                        .map((t) => `- "${t.title}" (ID: ${t.id})`)
                        .join("\n");
                    return `Multiple tasks found matching "${taskTitle}". Please use a more specific title or the exact task ID from this list:\n${taskList}`;
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
                name: "taskId",
                type: "string",
                description: "The ID of the task to mark complete",
                required: true,
            },
        ],
        handler: async ({ taskId }) => {
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
            "Delete a task. Always ask for confirmation before deleting.",
        parameters: [
            {
                name: "taskId",
                type: "string",
                description: "The ID of the task to delete",
                required: true,
            },
        ],
        handler: async ({ taskId }) => {
            const task = tasks?.find((t) => t.id === taskId);
            if (!task) return "Task not found";

            try {
                await deleteTask.mutateAsync(taskId);
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
            console.log(`Found ${matchingTasks.length} tasks matching "${title}":\n${taskList}`)
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

