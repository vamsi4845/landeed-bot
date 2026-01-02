"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { seedTasks } from "@/lib/actions";
import { Database } from "lucide-react";
import { toast } from "sonner";

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  async function handleSeed() {
    setIsLoading(true);
    try {
      await seedTasks();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Database seeded successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to seed database"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <Database className="h-4 w-4" />
      {isLoading ? "Seeding..." : "Seed Data"}
    </Button>
  );
}
