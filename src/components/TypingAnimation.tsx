import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export function TypingAnimation({ text, onComplete, speed = 30 }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="whitespace-pre-wrap">
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse border-r-2 border-primary ml-1"></span>
      )}
    </div>
  );
}