import { Edit3, MessageSquare, X } from 'lucide-react';
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
  isOpen: boolean;
  onToggle: () => void;
  
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, isOpen, onToggle }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-muted/30 border-r border-border flex flex-col z-10">
      {/* Candid header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="w-full justify-start text-lg font-semibold text-foreground hover:bg-transparent p-0 h-auto"
        >
          Candid
        </Button>
      </div>

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
            <Button
              key={chat.id}
              variant={currentChatId === chat.id ? "secondary" : "ghost"}
              onClick={() => onSelectChat(chat.id)}
              className="w-full justify-start p-3 h-auto text-left group hover:bg-accent/50"
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
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">William Go</div>
          <div>Irvine City Council • District 2</div>
        </div>
      </div>
    </div>
  );
}