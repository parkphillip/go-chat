
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EscalationButtonProps {
  onEscalate: () => void;
}

export function EscalationButton({ onEscalate }: EscalationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onEscalate();
    setIsLoading(false);
    setIsSent(true);
    
    // Reset after showing success
    setTimeout(() => setIsSent(false), 3000);
  };

  if (isSent) {
    return (
      <div className="text-sm text-green-600 font-medium animate-fade-in">
        Question forwarded ✓
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="sm"
      className={`relative overflow-hidden transition-all duration-200 ${
        isLoading ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 rounded-md">
          <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-primary via-primary to-transparent bg-clip-border animate-spin-slow">
            <div className="w-full h-full bg-background rounded-sm"></div>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 relative z-10">
        <Send className="h-3 w-3" />
        {isLoading ? 'Sending...' : 'Contact Team'}
      </div>
    </Button>
  );
}
