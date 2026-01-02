"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TASK_PRIORITIES } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });
import { format, isPast, isToday } from "date-fns";
import { Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, animateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = TASK_PRIORITIES[task.priority];
  const isOverdue =
    task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group cursor-grab active:cursor-grabbing transition-all duration-200",
        "bg-card backdrop-blur-sm border-border/50 hover:border-border",
        "hover:shadow-lg hover:shadow-primary/5",
        isDragging && "opacity-50 shadow-xl",
        isOverdue && "border-red-500/50 shadow-red-500/10"
      )}
    >
      <CardContent className="p-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {task.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className={cn(priorityConfig.textColor)}>
              {priorityConfig.label}
            </Badge>
            {task.due_date && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isOverdue && "text-red-400",
                  isDueToday && !isOverdue && "text-orange-400",
                  !isOverdue && !isDueToday && "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
