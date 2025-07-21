interface ThinkingAnimationProps {
  message: string;
}

export function ThinkingAnimation({ message }: ThinkingAnimationProps) {
  return (
    <div className="flex gap-3 justify-start mb-4">
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/30">
          {/* Vertical lines animation - OpenAI style */}
          <div className="flex gap-1 items-center">
            <div className="w-0.5 h-4 bg-primary/40 animate-[fade-in-out_1.5s_ease-in-out_infinite] [animation-delay:0ms]"></div>
            <div className="w-0.5 h-4 bg-primary/40 animate-[fade-in-out_1.5s_ease-in-out_infinite] [animation-delay:200ms]"></div>
            <div className="w-0.5 h-4 bg-primary/40 animate-[fade-in-out_1.5s_ease-in-out_infinite] [animation-delay:400ms]"></div>
            <div className="w-0.5 h-4 bg-primary/40 animate-[fade-in-out_1.5s_ease-in-out_infinite] [animation-delay:600ms]"></div>
          </div>
          
          <div className="text-sm text-muted-foreground font-medium">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}