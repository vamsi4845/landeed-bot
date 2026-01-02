"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  useGroupedTasksByStatus,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { STATUS_ORDER } from "@/lib/constants";
import type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/types";

export function TaskBoard() {
  const {
    data: tasksByStatus,
    isLoading,
    tasks,
    isError,
    error,
  } = useGroupedTasksByStatus();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddTask = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask.mutateAsync(taskToDelete);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  }, [taskToDelete, deleteTask]);

  const handleSubmit = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      try {
        if ("id" in data) {
          await updateTask.mutateAsync(data);
          toast.success("Task updated");
        } else {
          await createTask.mutateAsync(data);
          toast.success("Task created");
        }
        setModalOpen(false);
        setEditingTask(null);
      } catch {
        toast.error("Failed to save task");
      }
    },
    [createTask, updateTask]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks?.find((t) => t.id === active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTaskItem = tasks?.find((t) => t.id === activeId);
      if (!activeTaskItem) return;

      const isOverColumn = STATUS_ORDER.includes(overId as TaskStatus);
      const newStatus = isOverColumn
        ? (overId as TaskStatus)
        : tasks?.find((t) => t.id === overId)?.status;

      if (newStatus && newStatus !== activeTaskItem.status) {
        try {
          await updateTask.mutateAsync({ id: activeId, status: newStatus });
          toast.success(`Moved to ${newStatus.replace("_", " ")}`);
        } catch {
          toast.error("Failed to update task");
        }
      }
    },
    [tasks, updateTask]
  );

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium">Failed to load tasks</p>
          {error?.message && (
            <p className="text-sm text-muted-foreground">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 h-full">
          {STATUS_ORDER.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
        isLoading={createTask.isPending || updateTask.isPending}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={deleteTask.isPending}
      />
    </>
  );
}
