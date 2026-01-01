import { Sparkles } from "lucide-react";
import { TaskBoard } from "@/components/tasks";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { SeedButton } from "@/components/SeedButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <header className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Task Copilot
              </h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Manage your tasks with AI assistance. Press{" "}
              <kbd className="px-2 py-1 text-xs font-medium bg-muted border border-border rounded-md shadow-sm">
                ⌘K
              </kbd>{" "}
              or{" "}
              <kbd className="px-2 py-1 text-xs font-medium bg-muted border border-border rounded-md shadow-sm">
                Ctrl+K
              </kbd>{" "}
              to open copilot.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SeedButton />
            <ThemeSwitch />
          </div>
        </header>
        <TaskBoard />
      </div>
    </main>
  );
}
