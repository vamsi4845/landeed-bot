"use client";

import { CopilotSidebar as CopilotSidebarUI } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCopilotActions } from "@/hooks/use-copilot-actions";
import { COPILOT_LABELS, COPILOT_INSTRUCTIONS } from "@/lib/copilot-prompts";
import { CopilotHeader } from "./CopilotHeader";
import { CopilotSuggestionsList } from "./CopilotSuggestionsList";
import { CopilotErrorMessage } from "./CopilotErrorMessage";

export function CopilotSidebar() {
  useCopilotActions();

  return (
    <CopilotSidebarUI
      defaultOpen={false}
      clickOutsideToClose={true}
      labels={COPILOT_LABELS}
      instructions={COPILOT_INSTRUCTIONS}
      Header={CopilotHeader}
      RenderSuggestionsList={CopilotSuggestionsList}
      ErrorMessage={CopilotErrorMessage}
      className="copilotKitSidebar"
    />
  );
}
