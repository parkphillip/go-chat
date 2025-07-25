import { useState, useRef, useEffect } from 'react';
import { Send, Edit3, MessageSquare, Paperclip, Mic, Image, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ChatMessage } from './ChatMessage';
import { Sidebar } from './Sidebar';
// REMOVE: import { ApiKeyModal } from './ApiKeyModal';
import { useTypingAnimation } from '@/hooks/use-typing-animation';
import { useEscalationDetection } from '@/hooks/use-escalation-detection';
import OpenAI from 'openai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  needsEscalation?: boolean;
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  lastModified: Date;
  archived?: boolean;
  escalationSent?: boolean;
}

const BEN_VAZQUEZ_CONTEXT = `You are Benjamin “Ben” Vazquez, Santa Ana Mayor Pro Tem and Councilmember (Ward 2). You are speaking directly to constituents, students, and residents of Santa Ana. Use ONLY the information below to answer questions. If the answer can be found or reasonably deduced from the information below, answer as fully as possible. If the answer truly cannot be found in the information, respond ONLY with: “I can’t answer this because I don’t have the data. Please use the ‘Contact Ben Vazquez’s Team’ button below to send your question directly to the team.” Do not speculate, guess, or make up information.`;

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
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { updateDetection } = useEscalationDetection();

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

  const handleEscalation = (question: string, context: string) => {
    // Mark escalation as sent for current chat
    if (currentChatId) {
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, escalationSent: true }
          : chat
      ));
    }
    
    // Placeholder for future Supabase integration
    console.log('Question forwarded to Ben Vazquez\'s team');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const OPENAI_API_KEY = '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';

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

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    
    // If we're deleting the current chat, switch to a new chat
    if (currentChatId === chatId) {
      createNewChat();
    }
  };

  const archiveChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, archived: true }
        : chat
    ));
    
    // If we're archiving the current chat, switch to a new chat
    if (currentChatId === chatId) {
      createNewChat();
    }
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

  const checkEscalationForMessage = (messages: Message[], messageId: string) => {
    console.log('Checking escalation for message:', messageId);
    console.log('Messages for escalation check:', messages.map(m => ({ role: m.role, content: m.content.slice(0, 50) })));
    
    const shouldEscalate = updateDetection(messages);
    console.log('Should escalate:', shouldEscalate);
    
    if (shouldEscalate) {
      console.log('Escalation triggered, updating message');
      if (currentChat) {
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === messageId 
                    ? { ...msg, needsEscalation: true }
                    : msg
                )
              }
            : chat
        ));
      } else {
        setCurrentMessages(prev => prev.map(msg =>
          msg.id === messageId 
            ? { ...msg, needsEscalation: true }
            : msg
        ));
      }
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
    const lowerQuery = query.toLowerCase().trim();
    
    // Simple greetings and basic responses - no reasoning needed
    const simpleResponses = [
      'hello', 'hi', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no',
      'good morning', 'good afternoon', 'good evening', 'bye', 'goodbye'
    ];
    
    if (simpleResponses.some(phrase => lowerQuery === phrase || lowerQuery.startsWith(phrase + ' '))) {
      return false;
    }
    
    // Very short questions (under 15 characters) probably don't need reasoning
    if (lowerQuery.length < 15) {
      return false;
    }
    
    // Complex questions that need reasoning
    const complexKeywords = [
      'comprehensive', 'detailed', 'explain', 'overview', 'tell me about', 'describe',
      'what are your plans', 'policy', 'strategy', 'goals', 'priorities', 'how do you',
      'what is your position', 'development', 'transportation', 'housing', 'budget'
    ];
    
    return complexKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  const getRelevantReasoningSteps = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const steps = [];
    
    // For comprehensive/complex questions, show full reasoning
    const isComprehensive = ['comprehensive', 'detailed', 'overview', 'all your', 'tell me about'].some(phrase => 
      lowerQuery.includes(phrase)
    );
    
    if (isComprehensive) {
      steps.push("Searching District 2 resident database...");
      steps.push("Gathering comprehensive policy information...");
      steps.push("Connecting to Irvine City Council archives...");
      steps.push("Analyzing Ben Vazquez's initiatives and positions...");
      steps.push("Compiling community feedback and priorities...");
    } else {
      // For specific topic questions, show relevant steps
      if (lowerQuery.includes('ben') || lowerQuery.includes('background') || lowerQuery.includes('experience')) {
        steps.push("Accessing Ben Vazquez's background information...");
        steps.push("Retrieving City Council meeting records...");
      }
      if (lowerQuery.includes('great park') || lowerQuery.includes('development')) {
        steps.push("Connecting to Great Park development records...");
        steps.push("Analyzing planning department data...");
      }
      if (lowerQuery.includes('housing') || lowerQuery.includes('affordable')) {
        steps.push("Loading housing policy information...");
        steps.push("Analyzing affordability initiatives...");
      }
      if (lowerQuery.includes('transportation') || lowerQuery.includes('bike') || lowerQuery.includes('transit')) {
        steps.push("Accessing transportation planning documents...");
        steps.push("Reviewing bike lane and transit initiatives...");
      }
      if (lowerQuery.includes('student') || lowerQuery.includes('youth') || lowerQuery.includes('education')) {
        steps.push("Gathering student and youth program information...");
        steps.push("Analyzing community education initiatives...");
      }
      if (lowerQuery.includes('goal') || lowerQuery.includes('priority') || lowerQuery.includes('plan')) {
        steps.push("Reviewing policy priorities and goals...");
        steps.push("Connecting to district planning database...");
      }
      if (lowerQuery.includes('cost') || lowerQuery.includes('budget') || lowerQuery.includes('funding')) {
        steps.push("Accessing budget and funding information...");
        steps.push("Analyzing cost-benefit assessments...");
      }
    }
    
    // If no specific topic matched, use general steps (shorter for simpler questions)
    if (steps.length === 0) {
      steps.push("Searching District 2 information...");
      steps.push("Gathering relevant policy data...");
    }
    
    // Ensure at least 2 steps but not more than 5 for non-comprehensive questions
    if (!isComprehensive && steps.length > 3) {
      return steps.slice(0, 3);
    }
    
    return steps;
  };

  const getComplexityTiming = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Simple greetings and basic responses - very fast
    const simpleResponses = [
      'hello', 'hi', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no',
      'good morning', 'good afternoon', 'good evening', 'bye', 'goodbye'
    ];
    
    if (simpleResponses.some(phrase => lowerQuery === phrase || lowerQuery.startsWith(phrase + ' '))) {
      return { baseTime: 300, randomTime: 200 }; // 300-500ms per step
    }
    
    // Short questions - quick
    if (lowerQuery.length < 20) {
      return { baseTime: 600, randomTime: 300 }; // 600-900ms per step
    }
    
    // Comprehensive questions - longer processing
    const isComprehensive = ['comprehensive', 'detailed', 'overview', 'all your', 'tell me about'].some(phrase => 
      lowerQuery.includes(phrase)
    );
    
    if (isComprehensive) {
      return { baseTime: 1800, randomTime: 700 }; // 1.8-2.5s per step
    }
    
    // Default for moderate questions
    return { baseTime: 1000, randomTime: 500 }; // 1.0-1.5s per step
  };

  const simulateRAGThinking = async (query: string) => {
    const relevantSteps = getRelevantReasoningSteps(query);
    const timing = getComplexityTiming(query);
    console.log('Starting RAG thinking with steps:', relevantSteps, 'timing:', timing);
    
    for (let i = 0; i < relevantSteps.length; i++) {
      const step = relevantSteps[i];
      console.log('Setting thinking message:', step);
      setThinkingMessage(step);
      setIsThinking(true);
      
      // Variable timing based on complexity
      await new Promise(resolve => setTimeout(resolve, timing.baseTime + Math.random() * timing.randomTime));
    }
    
    console.log('RAG thinking completed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
      // For simple queries, show a brief thinking state with variable timing
      const timing = getComplexityTiming(userInput);
      setThinkingMessage('Processing your question...');
      setIsThinking(true);
      await new Promise(resolve => setTimeout(resolve, timing.baseTime));
    }

    try {
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      console.log('Starting OpenAI request...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: BEN_VAZQUEZ_CONTEXT },
          { role: 'user', content: userInput }
        ],
        max_tokens: getTokenLimit(userInput),
        temperature: 0.7
      });

      console.log('OpenAI response received');

      let assistantContent = response.choices[0]?.message?.content || 'I apologize, I encountered an issue generating a response.';
      const escalationMsg = "I can’t answer this because I don’t have the data. Please use the ‘Contact Ben Vazquez’s Team’ button below to send your question directly to the team.";
      const needsEscalation = assistantContent.trim() === escalationMsg;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date(),
        isTyping: true,
        ...(needsEscalation ? { needsEscalation: true } : {})
      };

      // Transition from thinking to typing
      console.log('Transitioning from thinking to typing');
      setIsThinking(false);
      setThinkingMessage('');
      setIsProcessingResponse(false);
      addMessage(chatId, assistantMessage);

      // Save chat to history after first assistant response if not already saved
      // Always add the chat to the sidebar after the first assistant response if it's not already there
      const chatExists = chats.some(chat => chat.id === chatId);
      if (!chatExists) {
        // Use the userMessage and assistantMessage directly for new chat
        const chatToSave: ChatData = {
          id: chatId,
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
          messages: [userMessage, assistantMessage],
          lastModified: new Date()
        };
        setChats(prev => [chatToSave, ...prev]);
      }
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
      {/* REMOVE: The ApiKeyModal component */}
      
      <Sidebar 
        chats={chats.filter(chat => !chat.archived)}
        currentChatId={currentChatId}
        onSelectChat={(chatId) => {
          setCurrentChatId(chatId);
          setCurrentMessages([]);
        }}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onArchiveChat={archiveChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Floating sidebar trigger - only visible when sidebar is closed */}
      {!sidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-20 h-10 w-10 border border-border rounded-full bg-background shadow hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)', borderWidth: 1, borderStyle: 'solid' }}
        >
          <PanelLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
      
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-200`}>
        
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {!messages.length && !isThinking ? (
            <div className="flex-1 flex items-center justify-center pb-12 pt-4 px-8">
              <div className="text-center max-w-2xl w-full">
                {/* William Go faded headshot floating above title - scaled up 15% */}
                <div className="mb-6 relative overflow-hidden">
                  <img 
                    src="/faded_bottom_juan.png" 
                    alt="Ben Vazquez, Santa Ana Mayor Pro Tem and Councilmember (Ward 2)"
                    className="w-52 h-auto mx-auto object-cover opacity-75 hover:opacity-85 transition-opacity duration-500 brightness-[1.15] contrast-[1.1] saturate-[1.05]"
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
                  Chat with Ben Vazquez
                </h1>
                <p className="text-base text-muted-foreground mb-6">
                  Santa Ana Mayor Pro Tem & Councilmember (Ward 2)
                </p>
                
                {/* Enhanced input form for new chat page */}
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
                  <div className="relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask Ben Vazquez about ${typingText}...`}
                      className="w-full pl-6 pr-16 pt-6 pb-16 text-base rounded-3xl border-0 shadow-lg bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-xl transition-all"
                      disabled={isThinking || isProcessingResponse}
                    />
                    
                    {/* Bottom icons row - 2 left, 1 right */}
                    <div className="absolute bottom-4 left-6 flex gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => console.log('Attach file')}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => console.log('Image upload')}
                      >
                        <Image className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* Right icons - Mic and Send */}
                    <div className="absolute bottom-4 right-6 flex gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => console.log('Voice input')}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                       <Button
                         type="submit"
                         size="icon"
                         disabled={!input.trim() || isThinking || isProcessingResponse}
                         className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                       >
                         <Send className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </form>
                
                {/* REMOVE: The Button that says 'Set OpenAI API Key' */}
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
                  
                  // Show suggestions for most assistant responses, but not if response already has questions or needs escalation
                  const shouldShowSuggestions = isAssistantMessage && 
                    isLatestMessage && 
                    !hasQuestions &&
                    !message.needsEscalation;
                  
                  const suggestions = shouldShowSuggestions ? generateSuggestions(message.content, messages) : undefined;

                  return (
                     <ChatMessage 
                       key={message.id} 
                       message={message}
                       suggestions={suggestions}
                       onSuggestionClick={handleSuggestionClick}
                       onEscalate={handleEscalation}
                       escalationSent={currentChat?.escalationSent || false}
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
                        
                        // Check for escalation after typing completes
                        if (message.role === 'assistant') {
                          const currentMessages = currentChat?.messages || messages;
                          checkEscalationForMessage(currentMessages, message.id);
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
          
          
          {/* Enhanced input form for ongoing chat - only show when there are messages */}
          {messages.length > 0 && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask Ben Vazquez anything...`}
                    className="w-full pl-6 pr-16 pt-6 pb-16 text-base rounded-3xl border-0 shadow-lg bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-xl transition-all"
                    disabled={isThinking || isProcessingResponse}
                  />
                  
                   {/* Bottom icons row - 2 left, 1 right */}
                   <div className="absolute bottom-4 left-6 flex gap-2">
                     <Button
                       type="button"
                       size="icon"
                       variant="ghost"
                       className="h-8 w-8 text-muted-foreground hover:text-foreground"
                       onClick={() => console.log('Attach file')}
                     >
                       <Paperclip className="h-5 w-5" />
                     </Button>
                     <Button
                       type="button"
                       size="icon"
                       variant="ghost"
                       className="h-8 w-8 text-muted-foreground hover:text-foreground"
                       onClick={() => console.log('Image upload')}
                     >
                       <Image className="h-5 w-5" />
                     </Button>
                   </div>
                   
                   {/* Right icons - Mic and Send */}
                   <div className="absolute bottom-4 right-6 flex gap-2">
                     <Button
                       type="button"
                       size="icon"
                       variant="ghost"
                       className="h-8 w-8 text-muted-foreground hover:text-foreground"
                       onClick={() => console.log('Voice input')}
                     >
                       <Mic className="h-5 w-5" />
                     </Button>
                     <Button
                       type="submit"
                       size="icon"
                       disabled={!input.trim() || isThinking || isProcessingResponse}
                       className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                     >
                       <Send className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
