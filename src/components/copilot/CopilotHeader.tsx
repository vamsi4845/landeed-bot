"use client";

import { HeaderProps, useChatContext } from "@copilotkit/react-ui";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopilotHeader({}: HeaderProps) {
  const { setOpen, icons, labels } = useChatContext();
  return (
    <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md p-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label="Go to home"
      >
        <Sparkles className="h-5 w-5 text-sidebar-primary" />
      </Link>
      <h2 className="text-base font-semibold text-sidebar-foreground">
        {labels.title}
      </h2>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(false)}
        className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label="Close sidebar"
      >
        {icons.headerCloseIcon}
      </Button>
    </div>
  );
}
