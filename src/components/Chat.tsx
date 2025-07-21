
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

RESPONSE STYLE: 
- For specific questions: Provide comprehensive, detailed answers (3-5 sentences) with concrete information, timelines, and specifics
- For broad questions (like "what are your policies"): Keep responses brief (2-3 sentences) as an overview
- Use "I" statements and be conversational but authoritative
- Provide definitive, actionable information when possible
- Focus on concrete plans, timelines, and specific initiatives rather than vague responses`;

const ragMessages = [
  "Searching District 2 resident database...",
  "Analyzing student concerns across District 2...",
  "Accessing City Council meeting archives...",
  "Gathering Great Park development updates...",
  "Retrieving William Go's transportation initiatives...",
  "Loading housing affordability data for Irvine...",
  "Connecting to Irvine planning department records...",
  "Fetching community feedback from District 2 residents...",
  "Reviewing William Go's policy positions...",
  "Connecting to Irvine transit planning documents...",
  "Analyzing bike lane expansion proposals...",
  "Loading Irvine Connect shuttle optimization plans...",
  "Searching budget allocation records...",
  "Accessing environmental impact assessments...",
  "Retrieving demographic analysis for District 2...",
  "Loading traffic pattern studies...",
  "Connecting to Orange County planning database...",
  "Analyzing zoning regulation updates...",
  "Fetching public safety incident reports...",
  "Searching community event participation data..."
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

  // Generate contextual suggestions based on the message content and conversation history
  const generateSuggestions = (content: string, conversationHistory: Message[]): string[] => {
    const suggestions = [];
    const lowerContent = content.toLowerCase();
    
    // Get previously asked questions to avoid repetition
    const previousQuestions = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.toLowerCase());

    const hasBeenAsked = (question: string) => 
      previousQuestions.some(prev => 
        prev.includes(question.toLowerCase().split(' ').slice(0, 3).join(' '))
      );

    // Policy-related suggestions
    if (lowerContent.includes('policy') || lowerContent.includes('policies')) {
      if (!hasBeenAsked("timeline for policy implementation")) suggestions.push("What's the timeline for policy implementation?");
      if (!hasBeenAsked("community input on policies")) suggestions.push("How can residents provide input on these policies?");
      if (!hasBeenAsked("policy funding sources")) suggestions.push("How are these policies being funded?");
    }
    // Housing-related suggestions
    else if (lowerContent.includes('housing') || lowerContent.includes('development') || lowerContent.includes('affordable')) {
      if (!hasBeenAsked("housing development timeline")) suggestions.push("What's the timeline for new housing developments?");
      if (!hasBeenAsked("affordable housing eligibility")) suggestions.push("Who qualifies for affordable housing programs?");
      if (!hasBeenAsked("housing impact on traffic")) suggestions.push("How will new housing impact traffic?");
    }
    // Transportation suggestions
    else if (lowerContent.includes('transport') || lowerContent.includes('bike') || lowerContent.includes('shuttle')) {
      if (!hasBeenAsked("transportation project costs")) suggestions.push("What's the cost of these transportation projects?");
      if (!hasBeenAsked("bike lane safety measures")) suggestions.push("What safety measures are included in bike lane designs?");
      if (!hasBeenAsked("shuttle service expansion")) suggestions.push("When will shuttle service be expanded?");
    }
    // Great Park suggestions
    else if (lowerContent.includes('great park') || lowerContent.includes('park')) {
      if (!hasBeenAsked("park construction timeline")) suggestions.push("What's the construction timeline for Great Park phases?");
      if (!hasBeenAsked("park funding sources")) suggestions.push("How is Great Park development funded?");
      if (!hasBeenAsked("park community programs")) suggestions.push("What recreational programs will be available?");
    }
    // Budget/Finance suggestions
    else if (lowerContent.includes('budget') || lowerContent.includes('cost') || lowerContent.includes('funding')) {
      if (!hasBeenAsked("budget transparency")) suggestions.push("How can residents track budget spending?");
      if (!hasBeenAsked("tax impact")) suggestions.push("Will this impact local taxes?");
      if (!hasBeenAsked("alternative funding")) suggestions.push("Are there alternative funding sources being considered?");
    }
    // Community/General suggestions
    else {
      if (!hasBeenAsked("community meetings schedule")) suggestions.push("When are the next community meetings?");
      if (!hasBeenAsked("district priorities ranking")) suggestions.push("What are your top 3 priorities for 2025?");
      if (!hasBeenAsked("student engagement opportunities")) suggestions.push("How can students get more involved in local government?");
    }

    // If no specific suggestions or all have been asked, add general ones
    if (suggestions.length === 0) {
      const generalSuggestions = [
        "What challenges do you foresee with implementation?",
        "How does this compare to other Orange County cities?",
        "What role can local businesses play in this?"
      ];
      generalSuggestions.forEach(suggestion => {
        if (!hasBeenAsked(suggestion)) suggestions.push(suggestion);
      });
    }

    return suggestions.slice(0, 2); // Limit to 2 suggestions to avoid clutter
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
    
    // Always start with database search
    steps.push("Searching District 2 resident database...");
    
    if (lowerQuery.includes('william') || lowerQuery.includes('background') || lowerQuery.includes('experience')) {
      steps.push("Accessing City Council meeting archives...");
      steps.push("Retrieving William Go's background information...");
    }
    if (lowerQuery.includes('great park') || lowerQuery.includes('development')) {
      steps.push("Connecting to Irvine planning department records...");
      steps.push("Analyzing Great Park development plans...");
    }
    if (lowerQuery.includes('housing') || lowerQuery.includes('affordable')) {
      steps.push("Loading housing affordability data for Irvine...");
      steps.push("Retrieving housing policy positions...");
      steps.push("Analyzing zoning regulation updates...");
    }
    if (lowerQuery.includes('transportation') || lowerQuery.includes('bike') || lowerQuery.includes('transit')) {
      steps.push("Connecting to Irvine transit planning documents...");
      steps.push("Accessing transportation initiatives...");
      steps.push("Loading traffic pattern studies...");
    }
    if (lowerQuery.includes('student') || lowerQuery.includes('youth') || lowerQuery.includes('education')) {
      steps.push("Analyzing student concerns across District 2...");
      steps.push("Fetching community feedback from District 2 residents...");
    }
    if (lowerQuery.includes('goal') || lowerQuery.includes('priority') || lowerQuery.includes('plan')) {
      steps.push("Reviewing William Go's policy positions...");
      steps.push("Connecting to Orange County planning database...");
    }
    
    // Add budget/cost related steps for financial queries
    if (lowerQuery.includes('cost') || lowerQuery.includes('budget') || lowerQuery.includes('funding')) {
      steps.push("Searching budget allocation records...");
      steps.push("Accessing environmental impact assessments...");
    }
    
    // Default steps if none match - ensure we always have at least 3-4 steps
    if (steps.length < 2) {
      steps.push("Gathering District 2 updates...");
      steps.push("Connecting to Irvine community data...");
      steps.push("Fetching public safety incident reports...");
    }
    
    // Ensure we have at least 3 steps for longer thinking time
    while (steps.length < 3) {
      const additionalSteps = [
        "Retrieving demographic analysis for District 2...",
        "Searching community event participation data...",
        "Accessing environmental impact assessments..."
      ];
      const randomStep = additionalSteps[Math.floor(Math.random() * additionalSteps.length)];
      if (!steps.includes(randomStep)) {
        steps.push(randomStep);
      }
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
      
      // Each step takes 1.2-1.8s for optimal thinking time
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 600));
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
            <div className="flex-1 flex items-center justify-center p-8 mt-[2vh]">
              <div className="text-center max-w-2xl w-full">
                {/* William Go faded headshot floating above title - scaled up 15% */}
                <div className="mb-6 relative overflow-hidden">
                  <img 
                    src="/lovable-uploads/c622cd8f-f6ed-41b9-8876-4f58b3b2bd7f.png" 
                    alt="William Go, Irvine City Councilmember District 2"
                    className="w-52 h-auto mx-auto object-cover opacity-75 hover:opacity-85 transition-opacity duration-500"
                  />
                  {/* Simple, clean fade without lines */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.8) 80%, white 100%)'
                    }}
                  ></div>
                </div>
                <h1 className="text-4xl font-medium text-foreground mb-3 relative z-10">
                  Chat with William Go
                </h1>
                <p className="text-xl text-muted-foreground mb-9">
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
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
                  // Perplexity-style: Show related questions after most assistant responses
                  const isAssistantMessage = message.role === 'assistant' && !message.isTyping;
                  const isLatestMessage = index === messages.length - 1;
                  const hasQuestions = message.content.includes('?');
                  
                  // Show suggestions for most assistant responses, but not if response already has questions
                  const shouldShowSuggestions = isAssistantMessage && 
                    isLatestMessage && 
                    !hasQuestions;
                  
                  const suggestions = shouldShowSuggestions ? generateSuggestions(message.content, messages) : undefined;

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
                    placeholder={apiKey ? "Ask William Go anything..." : "Please set your OpenAI API key first"}
                    className="w-full pl-6 pr-14 py-5 text-base rounded-3xl border-0 shadow-lg bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-xl transition-all"
                    disabled={isThinking || isProcessingResponse || !apiKey}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isThinking || isProcessingResponse || !apiKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
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
