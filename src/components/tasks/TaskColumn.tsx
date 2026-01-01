"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const statusConfig = TASK_STATUSES[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-h-[600px] rounded-xl",
        "bg-accent backdrop-blur-sm",
        "shadow-sm transition-all duration-200",
        isOver && "bg-primary/5 border-primary/40 shadow-md"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
          <h2 className="text-sm text-foreground">{statusConfig.label}</h2>
          <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full border">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-accent"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${statusConfig.label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm font-medium mb-3">No tasks</p>
            <Button
              variant="outline"
              size="sm"
              className="border-dashed"
              onClick={() => onAddTask(status)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
