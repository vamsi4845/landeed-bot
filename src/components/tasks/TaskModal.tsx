"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/types";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void;
  isLoading?: boolean;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  defaultStatus = "todo",
  onSubmit,
  isLoading,
}: TaskModalProps) {
  const isEditing = !!task;

  const initialValues = useMemo(() => {
    if (task) {
      return {
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date
          ? format(new Date(task.due_date), "yyyy-MM-dd")
          : "",
      };
    }
    return {
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium" as TaskPriority,
      dueDate: "",
    };
  }, [task, defaultStatus]);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [status, setStatus] = useState<TaskStatus>(initialValues.status);
  const [priority, setPriority] = useState<TaskPriority>(
    initialValues.priority
  );
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [dateError, setDateError] = useState<string | null>(null);

  const validateAndFormatDate = (dateString: string): string | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (date instanceof Date && !isNaN(date.valueOf())) {
      return date.toISOString();
    }
    return null;
  };

  const resetForm = () => {
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setStatus(initialValues.status);
    setPriority(initialValues.priority);
    setDueDate(initialValues.dueDate);
    setDateError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const validatedDueDate = validateAndFormatDate(dueDate);
    if (dueDate && !validatedDueDate) {
      setDateError("Invalid date format. Please enter a valid date.");
      return;
    }
    setDateError(null);

    if (isEditing && task) {
      onSubmit({
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: validatedDueDate,
      });
    } else {
      onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: validatedDueDate,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUSES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${config.color}`}
                        />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITIES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.textColor}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setDateError(null);
              }}
            />
            {dateError && (
              <p className="text-sm text-red-500 mt-1">{dateError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
