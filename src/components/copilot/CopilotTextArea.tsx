import { useState } from "react";
import { CopilotTextarea } from "@copilotkit/react-textarea";

export function CopilotTextArea() {
  const [text, setText] = useState<string>("");

  return (
    <CopilotTextarea
      className="w-full p-4 border border-gray-300 rounded-md"
      value={text}
      onValueChange={setText}
      placeholder="Start typing..."
      autosuggestionsConfig={{
        textareaPurpose: "Write your message here",
        chatApiConfigs: {
          suggestionsApiConfig: {
            maxTokens: 50,
            stop: ["\n", ".", "?"],
          },
        },
      }}
    />
  );
}
