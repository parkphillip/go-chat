import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function QuestionSuggestions({ suggestions, onSuggestionClick }: QuestionSuggestionsProps) {
  return (
    <div className="mt-4 pl-11"> {/* pl-11 to align with the message content */}
      <div className="border-l-2 border-muted-foreground/20 pl-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Related
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onSuggestionClick(suggestion)}
                className="h-auto p-3 w-full justify-start text-left hover:bg-muted/60 rounded-lg border border-muted/40 hover:border-muted transition-colors"
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-sm text-foreground/80 leading-relaxed flex-1">
                    {suggestion}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}