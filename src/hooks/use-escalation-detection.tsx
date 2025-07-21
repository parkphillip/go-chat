
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
      "i'd recommend contacting",
      "i don't have the exact",
      "without access to",
      "i would need more information",
      "specific timeline",
      "exact date",
      "specific policy details"
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
    if (messages.length < 2) return false; // Need at least 1 exchange
    
    console.log('Checking escalation with messages:', messages.length);
    
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistantMessage) return false;
    
    console.log('Last assistant message:', lastAssistantMessage.content.slice(0, 100));
    
    // Check for uncertainty in the latest assistant message
    const hasUncertainty = detectUncertainty(lastAssistantMessage.content);
    console.log('Has uncertainty:', hasUncertainty);
    
    // Check if user asked for very specific information
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return false;
    
    console.log('Last user message:', lastUserMessage.content);
    
    const specificKeywords = [
      'exact date', 'specific date', 'exact time', 'timeline for',
      'deadline', 'policy number', 'ordinance number', 'specific policy',
      'exact details', 'meeting minutes', 'vote results', 'specific budget',
      'exact amount', 'specific plan', 'detailed timeline', 'exact ways',
      'specific information', 'exact policy', 'implementation date',
      'exact cost', 'specific cost', 'exact price', 'specific price',
      'more specific', 'very specific', 'specific question', 'exact number',
      'specific timeline', 'exact timeline', 'more detail', 'exact detail',
      'specific detail', 'more information'
    ];
    
    const isSpecificQuestion = specificKeywords.some(keyword => 
      lastUserMessage.content.toLowerCase().includes(keyword)
    );
    
    console.log('Is specific question:', isSpecificQuestion, specificKeywords.filter(k => lastUserMessage.content.toLowerCase().includes(k)));
    
    const result = hasUncertainty || isSpecificQuestion; // Changed to OR instead of AND
    console.log('Final escalation result:', result);
    
    return result;
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
