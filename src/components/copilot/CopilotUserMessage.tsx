"use client";

import { UserMessageProps } from "@copilotkit/react-ui";
import { User } from "lucide-react";

type UserMessageContent = NonNullable<UserMessageProps["message"]>["content"];
type ContentPart =
  | { type: "text"; text: string }
  | {
      type: "binary";
      mimeType: string;
      id?: string;
      url?: string;
      data?: string;
      filename?: string;
    };

function getTextContent(
  content: UserMessageContent | undefined
): string | undefined {
  if (typeof content === "undefined") {
    return undefined;
  }

  if (typeof content === "string") {
    return content;
  }

  return (
    content
      .map((part: ContentPart) => {
        if (part.type === "text") {
          return part.text;
        }
        return undefined;
      })
      .filter(
        (value: string | undefined): value is string =>
          typeof value === "string" && value.length > 0
      )
      .join(" ")
      .trim() || undefined
  );
}

export function CopilotUserMessage({
  message,
  ImageRenderer,
}: UserMessageProps) {
  const isImageMessage =
    message && "image" in message && Boolean(message.image);
  const textContent = getTextContent(message?.content);
  const userName = message?.name;

  if (isImageMessage) {
    const imageMessage = message!;
    const content = getTextContent(imageMessage?.content);

    return (
      <div className="flex items-start gap-3 py-3">
        <div className="flex-1 min-w-0">
          {userName && (
            <div className="mb-1.5 text-xs font-medium text-sidebar-foreground/70">
              {userName}
            </div>
          )}
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            {content && (
              <div className="mt-3 text-sm text-sidebar-foreground leading-relaxed">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!textContent) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 py-3 justify-end">
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-2 py-1.5 w-fit">
        <div className="text-sm text-sidebar-foreground leading-relaxed whitespace-pre-wrap wrap-break-word w-fit">
          {textContent}
        </div>
      </div>
    </div>
  );
}
