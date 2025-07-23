import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, context: string) => void;
}

export function EscalationModal({ isOpen, onClose, onSubmit }: EscalationModalProps) {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSubmit(question, "Conversation context from escalation modal");
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Auto-close after success
    setTimeout(() => {
      setIsSuccess(false);
      setQuestion('');
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setQuestion('');
      setIsSuccess(false);
      onClose();
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="relative bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg animate-scale-in">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Question Sent!</h3>
            <p className="text-sm text-muted-foreground">
              Your question has been forwarded to Ben Vazquez's team. You'll receive a response soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-lg max-w-lg mx-4 shadow-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Contact Ben Vazquez's Team</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="question" className="block text-sm font-medium text-foreground mb-2">
              What specific information do you need?
            </label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Please provide details about your question or what specific information you're looking for..."
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              This will be sent directly to Ben Vazquez's team for a personalized response.
            </p>
            <Button
              type="submit"
              disabled={!question.trim() || isSubmitting}
              className="relative min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="text-xs">Sending...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-3 w-3" />
                  <span className="text-xs">Send Question</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}