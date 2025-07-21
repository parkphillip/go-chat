
import { useState } from 'react';
import { EscalationModal } from './EscalationModal';

interface EscalationPromptProps {
  onEscalate: (question: string, context: string) => void;
}

export function EscalationPrompt({ onEscalate }: EscalationPromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitEscalation = (question: string, context: string) => {
    onEscalate(question, context);
    setIsModalOpen(false);
    setIsSent(true);
  };

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8"></div>
        <div className="flex flex-col max-w-[75%] items-start">
          <div className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 rounded-bl-md">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Need more specific information? Send this question directly to William Go's team.
                </p>
              </div>
              <button
                onClick={handleOpenModal}
                disabled={isSent}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                  isSent 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20 cursor-default' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                }`}
              >
                {isSent ? 'Sent' : 'Contact Team'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <EscalationModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitEscalation}
      />
    </>
  );
}
