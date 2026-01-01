import { Sparkles } from "lucide-react";
import { TaskBoard } from "@/components/tasks";

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />{" "}
              Task Copilot
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your tasks with AI assistance. Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                ⌘K / Ctrl+K
              </kbd>{" "}
              to open copilot.{" "}
            </p>
          </div>
        </header>
        <TaskBoard />
      </div>
    </main>
  );
}
