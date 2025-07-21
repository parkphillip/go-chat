import { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ChatMessage } from './ChatMessage';
import { Sidebar } from './Sidebar';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

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

const WILLIAM_GO_CONTEXT = `You are an AI assistant specifically designed for William Go, Irvine City Councilmember for District 2. You have access to comprehensive information about his background, priorities, and current district initiatives.

William Go Background:
- First Chinese-Filipino American on Irvine City Council, elected November 2024
- First to represent District 2
- Immigrant from Philippines, first-generation college graduate
- BS Computer Engineering + MBA from UCI
- Software engineer & product manager at Broadcom
- Built real estate & hospitality portfolio (30+ locations), licensed broker
- Community service: lifeguard/swim coach, UCI Bike Ambassador supporter, Great Park Task Force & Irvine Transportation Commission member
- Ironman triathlete, cyclist, long-distance runner
- 20+ year Irvine resident in Great Park neighborhood

District 2 Priorities:
- Great Park development and optimization
- Protected bike lanes and cycling infrastructure
- Expanded Irvine Connect shuttle service
- Traffic and transportation improvements
- Housing affordability initiatives
- Safe neighborhoods and public safety
- Student and youth engagement

When responding, always speak as William Go's dedicated AI assistant, referencing his specific experience and priorities. Be conversational, knowledgeable, and focused on how his background informs solutions for District 2 residents.`;

const ragMessages = [
  "Analyzing student concerns across District 2...",
  "Gathering Great Park development updates...",
  "Retrieving William Go's transportation initiatives...",
  "Loading housing affordability data for Irvine...",
  "Accessing recent City Council meeting notes...",
  "Fetching community feedback from District 2 residents...",
  "Reviewing William Go's policy positions...",
  "Connecting to Irvine transit planning documents...",
  "Analyzing bike lane expansion proposals...",
  "Loading Irvine Connect shuttle optimization plans..."
];

export function Chat() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isThinking]);

  const createNewChat = () => {
    const newChat: ChatData = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastModified: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '') }
        : chat
    ));
  };

  const addMessage = (chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, message],
            lastModified: new Date()
          }
        : chat
    ));
  };

  const simulateRAGThinking = async () => {
    const randomMessage = ragMessages[Math.floor(Math.random() * ragMessages.length)];
    setThinkingMessage(randomMessage);
    setIsThinking(true);
    
    // Simulate thinking time between 1.5-3 seconds
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    
    setIsThinking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      createNewChat();
      chatId = Date.now().toString();
      const newChat: ChatData = {
        id: chatId,
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        lastModified: new Date()
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    addMessage(chatId, userMessage);
    
    // Update chat title if it's the first message
    if (!currentChat?.messages.length) {
      updateChatTitle(chatId, input);
    }

    setInput('');
    
    // Simulate RAG thinking
    await simulateRAGThinking();

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: WILLIAM_GO_CONTEXT },
          { role: 'user', content: input }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.choices[0]?.message?.content || 'I apologize, I encountered an issue generating a response.',
        role: 'assistant',
        timestamp: new Date()
      };

      addMessage(chatId, assistantMessage);
    } catch (error) {
      console.error('OpenAI API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, I encountered a technical issue. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      addMessage(chatId, errorMessage);
    }
  };

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-200`}>
        {!sidebarOpen && (
          <div className="p-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {!currentChat?.messages.length && !isThinking ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Chat with William Go
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Your dedicated AI assistant for District 2 insights, community updates, 
                  and policy discussions. Ask about Great Park development, transportation, 
                  housing, or any other district priorities.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-6 py-4">
                {currentChat?.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isThinking && (
                  <ThinkingAnimation message={thinkingMessage} />
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
          
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask William Go about District 2, Great Park, transportation, housing..."
                    className="pr-12 py-3 text-base border-2 rounded-xl focus:border-primary/50 bg-background"
                    disabled={isThinking}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}