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
        "flex flex-col h-full min-h-[500px] rounded-xl",
        "bg-muted/30 border border-border/50",
        "transition-colors duration-200",
        isOver && "bg-primary/5 border-primary/30"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
          <h2 className="font-semibold text-sm">{statusConfig.label}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${statusConfig.label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
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
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">No tasks</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => onAddTask(status)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
