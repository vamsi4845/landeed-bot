"use client";

import { UserMessageProps } from "@copilotkit/react-ui";

type UserMessageContent = NonNullable<UserMessageProps["message"]>["content"];

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
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }
        return undefined;
      })
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
      .join(" ")
      .trim() || undefined
  );
}

export function CopilotUserMessage(props: UserMessageProps) {
  const { message, ImageRenderer } = props;
  const isImageMessage =
    message && "image" in message && Boolean(message.image);

  if (isImageMessage) {
    const imageMessage = message!;
    const content = getTextContent(imageMessage?.content);

    return (
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-sidebar-foreground">
        <ImageRenderer image={imageMessage.image!} content={content} />
      </div>
    );
  }

  const content = getTextContent(message?.content);

  return (
    <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 px-4 py-3 text-sm text-sidebar-foreground w-fit">
      {content}
    </div>
  );
}
