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
import type { Task, TaskWithSubtasks } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface TaskGroupCardProps {
  task: TaskWithSubtasks;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onEditSubtask?: (task: Task) => void;
  onDeleteSubtask?: (id: string) => void;
}

export function TaskGroupCard({
  task,
  onEdit,
  onDelete,
  onEditSubtask,
  onDeleteSubtask,
}: TaskGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = TASK_PRIORITIES[task.priority];
  const isOverdue =
    task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  const completedSubtasks = task.subtasks.filter(
    (st) => st.status === "done"
  ).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress =
    totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group transition-all duration-200",
        "bg-card backdrop-blur-sm border-border/50 hover:border-border",
        "hover:shadow-lg hover:shadow-primary/5",
        isDragging && "opacity-50 shadow-xl rotate-2",
        isOverdue && "border-red-500/50 shadow-red-500/10"
      )}
    >
      <CardContent className="p-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex items-start gap-2 flex-1 min-w-0"
              {...listeners}
            >
              {task.subtasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mt-0.5 shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              <div className="flex-1 min-w-0 cursor-grab active:cursor-grabbing">
                <h3 className="font-medium text-sm leading-tight line-clamp-2">
                  {task.title}
                </h3>
                {subtaskProgress && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subtaskProgress} subtasks completed
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
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

          {isExpanded && task.subtasks.length > 0 && (
            <div className="pt-2 space-y-1.5 border-t border-border/50">
              {task.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onEdit={onEditSubtask || onEdit}
                  onDelete={onDeleteSubtask || onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SubtaskItemProps {
  subtask: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function SubtaskItem({ subtask, onEdit, onDelete }: SubtaskItemProps) {
  const priorityConfig = TASK_PRIORITIES[subtask.priority];
  const isOverdue =
    subtask.due_date &&
    isPast(new Date(subtask.due_date)) &&
    subtask.status !== "done";
  const isDueToday = subtask.due_date && isToday(new Date(subtask.due_date));
  const isCompleted = subtask.status === "done";

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-md bg-accent/50 hover:bg-accent transition-colors",
        isCompleted && "opacity-60"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
              isCompleted ? "bg-green-500" : "bg-muted-foreground"
            )}
          />
          <h4
            className={cn(
              "text-xs font-medium leading-tight",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {subtask.title}
          </h4>
        </div>
        {subtask.description && (
          <p className="text-[10px] text-muted-foreground mt-1 ml-3.5 line-clamp-1">
            {subtask.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 ml-3.5">
          <Badge
            variant="outline"
            className={cn("h-4 text-[10px] px-1.5", priorityConfig.textColor)}
          >
            {priorityConfig.label}
          </Badge>
          {subtask.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue && "text-red-400",
                isDueToday && !isOverdue && "text-orange-400",
                !isOverdue && !isDueToday && "text-muted-foreground"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(subtask.due_date), "MMM d")}
            </div>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(subtask)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(subtask.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
