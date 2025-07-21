
import { EscalationButton } from './EscalationButton';

interface EscalationPromptProps {
  onEscalate: (question: string, context: string) => void;
}

export function EscalationPrompt({ onEscalate }: EscalationPromptProps) {
  const handleEscalate = () => {
    // For now, we'll pass placeholder data
    onEscalate("User question requiring team attention", "Conversation context");
  };

  return (
    <div className="ml-11 mb-4 animate-fade-in">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Need more specific information? Send this question directly to William Go's team.
          </p>
        </div>
        <EscalationButton onEscalate={handleEscalate} />
      </div>
    </div>
  );
}
