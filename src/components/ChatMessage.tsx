import { User } from 'lucide-react';
import { TypingAnimation } from './TypingAnimation';
import { QuestionSuggestions } from './QuestionSuggestions';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onTypingComplete?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessage({ message, onTypingComplete, suggestions, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className="mb-6">
      {/* User message - pinned style like Perplexity */}
      {isUser && (
        <div className="flex gap-3 justify-end mb-4">
          <div className="flex flex-col max-w-[70%] items-end">
            <div className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground rounded-br-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Assistant message */}
      {!isUser && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
              WG
            </div>
            <div className="flex flex-col max-w-[75%] items-start">
              <div className="px-4 py-3 rounded-2xl bg-muted/50 rounded-bl-md">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {message.isTyping ? (
                    <TypingAnimation 
                      text={message.content} 
                      onComplete={onTypingComplete}
                      speed={8}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Show suggestions only for assistant messages that are not typing and have suggestions */}
          {!message.isTyping && suggestions && suggestions.length > 0 && onSuggestionClick && (
            <QuestionSuggestions 
              suggestions={suggestions} 
              onSuggestionClick={onSuggestionClick}
            />
          )}
        </>
      )}
    </div>
  );
}