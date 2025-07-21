
import { Edit3, MessageSquare, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  lastModified: Date;
}

interface SidebarProps {
  chats: ChatData[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, isOpen, onToggle }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-muted/40 border-r border-border flex flex-col z-10">
      {/* Chats section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Edit3 className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <Button
                variant={currentChatId === chat.id ? "secondary" : "ghost"}
                onClick={() => onSelectChat(chat.id)}
                className="w-full justify-start p-3 h-auto text-left hover:bg-accent/50"
              >
                <div className="flex items-start gap-2 w-full">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {chat.lastModified.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Button>
              
              {/* Delete button - only show on hover */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this chat? This action cannot be undone.')) {
                    onDeleteChat(chat.id);
                  }
                }}
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground">William Go</div>
            <div className="text-xs text-muted-foreground">Irvine City Council • District 2</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground/70">
          Powered by Candid
        </div>
      </div>
    </div>
  );
}
