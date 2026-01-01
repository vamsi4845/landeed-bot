import {
  CopilotChatSuggestion,
  RenderSuggestion,
  RenderSuggestionsListProps,
} from "@copilotkit/react-ui";

export function CopilotSuggestionsList({
  suggestions,
  onSuggestionClick,
}: RenderSuggestionsListProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 bg-sidebar">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion: CopilotChatSuggestion, index) => (
          <RenderSuggestion
            key={index}
            title={suggestion.title}
            message={suggestion.message}
            partial={suggestion.partial}
            className="cursor-pointer rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1.5 text-sm text-sidebar-accent-foreground transition-all hover:border-sidebar-primary hover:bg-sidebar-accent/80 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring active:scale-[0.98]"
            onClick={() => onSuggestionClick(suggestion.message)}
          />
        ))}
      </div>
    </div>
  );
}
