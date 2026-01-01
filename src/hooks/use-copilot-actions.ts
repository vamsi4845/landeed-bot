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
            "Break a task into smaller subtasks. Always show the subtasks to the user and ask for confirmation before creating them.",
        parameters: [
            {
                name: "parentTaskId",
                type: "string",
                description: "The ID of the task to break down",
                required: true,
            },
            {
                name: "subtasks",
                type: "object[]",
                description: "Array of subtasks with title and optional description",
                required: true,
            },
        ],
        handler: async ({ parentTaskId, subtasks }) => {
            const parentTask = tasks?.find((t) => t.id === parentTaskId);
            if (!parentTask) return "Parent task not found";

            try {
                const subtaskData = (
                    subtasks as Array<{ title: string; description?: string }>
                ).map((s) => ({
                    title: s.title,
                    description: s.description,
                }));
                await createSubtasks.mutateAsync({
                    parentId: parentTaskId,
                    subtasks: subtaskData,
                });
                toast.success(
                    `Created ${subtaskData.length} subtasks for "${parentTask.title}"`
                );
                return `Successfully created ${subtaskData.length} subtasks for "${parentTask.title}"`;
            } catch {
                toast.error("Failed to create subtasks");
                return "Failed to create subtasks";
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

