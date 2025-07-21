import { Bot } from 'lucide-react';

interface ThinkingAnimationProps {
  message: string;
}

export function ThinkingAnimation({ message }: ThinkingAnimationProps) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground border border-border">
        <Bot className="w-4 h-4" />
      </div>
      
      <div className="flex flex-col items-start">
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-accent/30 border border-accent animate-pulse">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground font-medium">
              {message}
            </div>
            
            {/* Animated dots */}
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
          
          {/* Animated progress bar */}
          <div className="mt-2 w-full bg-accent/50 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}