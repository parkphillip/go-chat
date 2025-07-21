
import { useState, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface EscalationState {
  topicDepth: Map<string, number>;
  uncertaintyCount: number;
  lastTopic: string | null;
}

export function useEscalationDetection() {
  const [state, setState] = useState<EscalationState>({
    topicDepth: new Map(),
    uncertaintyCount: 0,
    lastTopic: null
  });

  const detectUncertainty = (content: string): boolean => {
    const uncertaintyPhrases = [
      "i'm not sure",
      "i don't have specific",
      "unclear",
      "i apologize, i don't have",
      "i don't have access to",
      "would need to check",
      "specific details aren't available",
      "i'd recommend contacting"
    ];
    
    return uncertaintyPhrases.some(phrase => 
      content.toLowerCase().includes(phrase)
    );
  };

  const extractTopic = (content: string): string => {
    const topicKeywords = [
      'housing', 'transportation', 'great park', 'budget', 
      'development', 'bike lanes', 'shuttle', 'policy',
      'meeting', 'council', 'vote', 'ordinance'
    ];
    
    const found = topicKeywords.find(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    return found || 'general';
  };

  const shouldEscalate = useCallback((messages: Message[]): boolean => {
    if (messages.length < 4) return false; // Need at least 2 exchanges
    
    const recentMessages = messages.slice(-6); // Look at last 6 messages
    const assistantMessages = recentMessages.filter(m => m.role === 'assistant');
    
    // Check for uncertainty in recent assistant messages
    const hasUncertainty = assistantMessages.some(msg => 
      detectUncertainty(msg.content)
    );
    
    // Check for repeated questions on same topic
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const topics = userMessages.map(msg => extractTopic(msg.content));
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const hasRepeatedTopic = Object.values(topicCounts).some(count => count >= 2);
    
    return hasUncertainty && hasRepeatedTopic;
  }, []);

  const updateDetection = useCallback((messages: Message[]) => {
    const shouldTriggerEscalation = shouldEscalate(messages);
    return shouldTriggerEscalation;
  }, [shouldEscalate]);

  return {
    updateDetection,
    shouldEscalate
  };
}
