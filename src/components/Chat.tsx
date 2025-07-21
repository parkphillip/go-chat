
import { useState, useRef, useEffect } from 'react';
import { Send, Edit3, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ChatMessage } from './ChatMessage';
import { Sidebar } from './Sidebar';
import { ApiKeyModal } from './ApiKeyModal';
import { useTypingAnimation } from '@/hooks/use-typing-animation';
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
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typing animation for placeholder (only for new chat)
  const typingText = useTypingAnimation({
    words: ['policy', 'goals', 'the great park', 'housing', 'bike lanes', 'transportation', 'community'],
    typeSpeed: 80,
    deleteSpeed: 40,
    pauseDuration: 6500
  });

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || currentMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate contextual suggestions based on the message content
  const generateSuggestions = (content: string): string[] => {
    const suggestions = [];
    const lowerContent = content.toLowerCase();

    // Policy-related suggestions
    if (lowerContent.includes('policy') || lowerContent.includes('policies')) {
      suggestions.push("What are William Go's key policy priorities?", "How do these policies compare to other districts?");
    }

    // Housing-related suggestions
    if (lowerContent.includes('housing') || lowerContent.includes('development')) {
      suggestions.push("What's the current housing situation in District 2?", "What are the proposed housing solutions?");
    }

    // Transportation suggestions
    if (lowerContent.includes('transport') || lowerContent.includes('bike') || lowerContent.includes('road')) {
      suggestions.push("What transportation improvements are planned?", "How will bike lane expansions work?");
    }

    // Great Park suggestions
    if (lowerContent.includes('great park') || lowerContent.includes('park')) {
      suggestions.push("What are the latest Great Park developments?", "How will the Great Park benefit residents?");
    }

    // Budget/Finance suggestions
    if (lowerContent.includes('budget') || lowerContent.includes('cost') || lowerContent.includes('funding')) {
      suggestions.push("What's the budget allocation for this initiative?", "How is this project being funded?");
    }

    // Community suggestions
    if (lowerContent.includes('community') || lowerContent.includes('resident')) {
      suggestions.push("How can residents get involved?", "What community programs are available?");
    }

    // Default suggestions if no specific topic detected
    if (suggestions.length === 0) {
      suggestions.push(
        "What other priorities does William Go have?",
        "How can I stay updated on District 2 developments?",
        "What community events are coming up?"
      );
    }

    // Limit to 3 suggestions
    return suggestions.slice(0, 3);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Optionally auto-submit the suggestion
    // handleSubmit could be called here with the suggestion
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const createNewChat = () => {
    // If there's a current conversation with messages, save it to history
    if (currentChatId && messages.length > 0) {
      if (currentChat) {
        // Update existing chat in history
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages, lastModified: new Date() }
            : chat
        ));
      } else {
        // Save current conversation to history
        const chatToSave: ChatData = {
          id: currentChatId,
          title: messages[0]?.content.slice(0, 30) + (messages[0]?.content.length > 30 ? '...' : '') || 'New Chat',
          messages: [...messages],
          lastModified: new Date()
        };
        setChats(prev => [chatToSave, ...prev]);
      }
    }
    
    // Clear the interface for new chat
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setCurrentMessages([]);
    
    // Clear states for fresh start
    setInput('');
    setIsThinking(false);
    setThinkingMessage('');
    setIsProcessingResponse(false);
  };

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '') }
        : chat
    ));
  };

  const addMessage = (chatId: string, message: Message) => {
    if (currentChat) {
      // Update existing chat in history
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, message],
              lastModified: new Date()
            }
          : chat
      ));
    } else {
      // Add to current conversation
      setCurrentMessages(prev => [...prev, message]);
    }
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
    console.log('Starting RAG thinking with steps:', relevantSteps);
    
    for (let i = 0; i < relevantSteps.length; i++) {
      const step = relevantSteps[i];
      console.log('Setting thinking message:', step);
      setThinkingMessage(step);
      setIsThinking(true);
      
      // Each step takes 1-1.5s
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    }
    
    console.log('RAG thinking completed');
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
      // Create temporary chat ID for current conversation
      chatId = Date.now().toString();
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
    if (messages.length === 1) {
      updateChatTitle(chatId, input);
    }

    const userInput = input;
    setInput('');
    setIsProcessingResponse(true);
    
    // Initialize thinking state
    setIsThinking(false);
    setThinkingMessage('');
    
    // Conditionally simulate RAG thinking
    if (shouldShowReasoning(userInput)) {
      console.log('Should show reasoning for query:', userInput);
      await simulateRAGThinking(userInput);
    } else {
      console.log('Skipping reasoning for simple query:', userInput);
      // For simple queries, show a brief thinking state
      setThinkingMessage('Processing your question...');
      setIsThinking(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      console.log('Starting OpenAI request...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: WILLIAM_GO_CONTEXT },
          { role: 'user', content: userInput }
        ],
        max_tokens: getTokenLimit(userInput),
        temperature: 0.7
      });

      console.log('OpenAI response received');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.choices[0]?.message?.content || 'I apologize, I encountered an issue generating a response.',
        role: 'assistant',
        timestamp: new Date(),
        isTyping: true
      };

      // Transition from thinking to typing
      console.log('Transitioning from thinking to typing');
      setIsThinking(false);
      setThinkingMessage('');
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
      setThinkingMessage('');
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
        onSelectChat={(chatId) => {
          setCurrentChatId(chatId);
          setCurrentMessages([]);
        }}
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
          {!messages.length && !isThinking ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl w-full">
                <h1 className="text-4xl font-medium text-foreground mb-2">
                  Chat with William Go
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Irvine Councilmember District 2
                </p>
                
                {/* Input form for new chat page */}
                <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-6">
                  <div className="relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={apiKey ? `Ask William Go about ${typingText}...` : "Please set your OpenAI API key first"}
                      className="w-full pl-6 pr-14 py-5 text-base rounded-3xl border-0 shadow-lg bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-xl transition-all"
                      disabled={isThinking || isProcessingResponse || !apiKey}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isThinking || isProcessingResponse || !apiKey}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-5" />
                    </Button>
                  </div>
                </form>
                
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
                {messages.map((message, index) => {
                  const isLastAssistantMessage = message.role === 'assistant' && 
                    index === messages.length - 1 &&
                    !message.isTyping;
                  
                  const suggestions = isLastAssistantMessage ? generateSuggestions(message.content) : undefined;

                  return (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      suggestions={suggestions}
                      onSuggestionClick={handleSuggestionClick}
                      onTypingComplete={() => {
                        // Update message to stop typing animation
                        if (currentChat) {
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
                        } else {
                          setCurrentMessages(prev => prev.map(msg =>
                            msg.id === message.id 
                              ? { ...msg, isTyping: false }
                              : msg
                          ));
                        }
                      }}
                    />
                  );
                })}
                {(isThinking || isProcessingResponse) && thinkingMessage && (
                  <div>
                    <ThinkingAnimation message={thinkingMessage} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
          
          
          {/* Input form for ongoing chat - only show when there are messages */}
          {messages.length > 0 && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={apiKey ? "Ask William Go about District 2..." : "Please set your OpenAI API key first"}
                    className="w-full pl-6 pr-14 py-5 text-base rounded-3xl border-0 shadow-lg bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-xl transition-all"
                    disabled={isThinking || isProcessingResponse || !apiKey}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isThinking || isProcessingResponse || !apiKey}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
