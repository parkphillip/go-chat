import { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ChatMessage } from './ChatMessage';
import { Sidebar } from './Sidebar';
import { ApiKeyModal } from './ApiKeyModal';
import OpenAI from 'openai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  lastModified: Date;
}

const WILLIAM_GO_CONTEXT = `You are William Go, Irvine City Councilmember for District 2. You are speaking directly to constituents and students.

Your Background:
- First Chinese-Filipino American on Irvine City Council, elected November 2024
- First to represent District 2
- Immigrant from Philippines, first-generation college graduate
- BS Computer Engineering + MBA from UCI
- Software engineer & product manager at Broadcom
- Built real estate & hospitality portfolio (30+ locations), licensed broker
- Community service: lifeguard/swim coach, UCI Bike Ambassador supporter, Great Park Task Force & Irvine Transportation Commission member
- Ironman triathlete, cyclist, long-distance runner
- 20+ year Irvine resident in Great Park neighborhood

Your District 2 Priorities:
- Great Park development and optimization
- Protected bike lanes and cycling infrastructure
- Expanded Irvine Connect shuttle service
- Traffic and transportation improvements
- Housing affordability initiatives
- Safe neighborhoods and public safety
- Student and youth engagement

RESPONSE STYLE: Keep responses brief (2-3 sentences max). Always end with 2-3 specific follow-up questions to guide the conversation deeper. Use "I" statements and be conversational. Focus on one main point per response.`;

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
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isThinking]);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

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

  const getTokenLimit = (question: string): number => {
    const lowerQuestion = question.toLowerCase();
    
    // Comprehensive questions need more tokens
    if (lowerQuestion.includes('comprehensive') || lowerQuestion.includes('detailed') || 
        lowerQuestion.includes('explain') || lowerQuestion.includes('overview') ||
        lowerQuestion.includes('tell me about') || lowerQuestion.includes('describe') ||
        lowerQuestion.includes('what are your plans') || lowerQuestion.includes('policy') ||
        lowerQuestion.includes('strategy')) {
      return 300;
    }
    
    // Simple yes/no or basic questions
    if (lowerQuestion.includes('yes') || lowerQuestion.includes('no') || 
        lowerQuestion.includes('when') || lowerQuestion.includes('where') ||
        lowerQuestion.length < 30) {
      return 150;
    }
    
    // Default for moderate questions
    return 220;
  };

  const shouldShowReasoning = (query: string) => {
    // Check if query is meaningful (not gibberish)
    const meaningfulWords = [
      'william', 'go', 'district', 'great', 'park', 'housing', 'transportation', 
      'bike', 'lanes', 'irvine', 'council', 'policy', 'what', 'how', 'why', 
      'when', 'where', 'goals', 'priorities', 'plans', 'student', 'youth'
    ];
    
    const queryWords = query.toLowerCase().split(' ');
    const hasValidWords = queryWords.some(word => 
      word.length > 2 && (meaningfulWords.includes(word) || /^[a-z]+$/.test(word))
    );
    
    return hasValidWords && query.trim().length > 5;
  };

  const getRelevantReasoningSteps = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const steps = [];
    
    if (lowerQuery.includes('william') || lowerQuery.includes('background') || lowerQuery.includes('experience')) {
      steps.push("Searching William Go's background...");
    }
    if (lowerQuery.includes('great park') || lowerQuery.includes('development')) {
      steps.push("Analyzing Great Park development plans...");
    }
    if (lowerQuery.includes('housing') || lowerQuery.includes('affordable')) {
      steps.push("Retrieving housing policy positions...");
    }
    if (lowerQuery.includes('transportation') || lowerQuery.includes('bike') || lowerQuery.includes('transit')) {
      steps.push("Accessing transportation initiatives...");
    }
    if (lowerQuery.includes('student') || lowerQuery.includes('youth') || lowerQuery.includes('education')) {
      steps.push("Analyzing student concerns across District 2...");
    }
    if (lowerQuery.includes('goal') || lowerQuery.includes('priority') || lowerQuery.includes('plan')) {
      steps.push("Reviewing William Go's policy positions...");
    }
    
    // Default steps if none match
    if (steps.length === 0) {
      steps.push("Gathering District 2 updates...");
      steps.push("Connecting to Irvine community data...");
    }
    
    return steps;
  };

  const simulateRAGThinking = async (query: string) => {
    const relevantSteps = getRelevantReasoningSteps(query);
    
    for (const step of relevantSteps) {
      setThinkingMessage(step);
      setIsThinking(true);
      
      // Each step takes 800ms-1.2s (faster)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    }
    
    // Don't stop thinking here - let the response handle it
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

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

    const userInput = input;
    setInput('');
    setIsProcessingResponse(true);
    
    // Conditionally simulate RAG thinking
    if (shouldShowReasoning(userInput)) {
      await simulateRAGThinking(userInput);
    }

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: WILLIAM_GO_CONTEXT },
          { role: 'user', content: userInput }
        ],
        max_tokens: getTokenLimit(userInput),
        temperature: 0.7
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.choices[0]?.message?.content || 'I apologize, I encountered an issue generating a response.',
        role: 'assistant',
        timestamp: new Date(),
        isTyping: true
      };

      // Transition from thinking to typing
      setIsThinking(false);
      setIsProcessingResponse(false);
      addMessage(chatId, assistantMessage);
    } catch (error) {
      console.error('OpenAI API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, I encountered a technical issue. Please check your API key and try again.',
        role: 'assistant',
        timestamp: new Date(),
        isTyping: true
      };
      setIsThinking(false);
      setIsProcessingResponse(false);
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
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onSave={(key) => {
          setApiKey(key);
          setShowApiKeyModal(false);
        }}
        onClose={() => setShowApiKeyModal(false)}
      />
      
      <Sidebar 
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setShowApiKeyModal(true)}
      />
      
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-200`}>
        {!sidebarOpen && (
          <div className="p-4 border-b border-border flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowApiKeyModal(true)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
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
                {!apiKey && (
                  <Button 
                    onClick={() => setShowApiKeyModal(true)}
                    className="mt-4"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Set OpenAI API Key
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-6 py-4">
                {currentChat?.messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onTypingComplete={() => {
                      // Update message to stop typing animation
                      setChats(prev => prev.map(chat => 
                        chat.id === currentChatId 
                          ? {
                              ...chat,
                              messages: chat.messages.map(msg =>
                                msg.id === message.id 
                                  ? { ...msg, isTyping: false }
                                  : msg
                              )
                            }
                          : chat
                      ));
                    }}
                  />
                ))}
                {(isThinking || isProcessingResponse) && (
                  <div>
                    <ThinkingAnimation message={thinkingMessage} />
                  </div>
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
                    placeholder={apiKey ? "Ask William Go about District 2, Great Park, transportation, housing..." : "Please set your OpenAI API key first"}
                    className="pr-12 py-3 text-base border-2 rounded-xl focus:border-primary/50 bg-background"
                    disabled={isThinking || isProcessingResponse || !apiKey}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isThinking || isProcessingResponse || !apiKey}
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