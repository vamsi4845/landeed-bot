"use client";

import { ErrorMessageProps } from "@copilotkit/react-ui";
import { AlertCircle, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopilotErrorMessage({
  error,
  isCurrentMessage,
  onRegenerate,
  onCopy,
}: ErrorMessageProps) {
  const handleCopy = () => {
    if (onCopy) {
      onCopy(error.message);
    } else {
      navigator.clipboard.writeText(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive">
              Something went wrong
            </h4>
            {error.operation && (
              <p className="text-xs text-muted-foreground">
                Operation: {error.operation}
              </p>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-destructive/20">
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="h-8 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try again
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copy error
        </Button>
      </div>
    </div>
  );
}
