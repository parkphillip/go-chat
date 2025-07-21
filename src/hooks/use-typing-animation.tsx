import { useState, useEffect } from 'react';

interface UseTypingAnimationOptions {
  words: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

export const useTypingAnimation = ({
  words,
  typeSpeed = 100,
  deleteSpeed = 50,
  pauseDuration = 2000
}: UseTypingAnimationOptions) => {
  const [displayText, setDisplayText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
          return;
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, currentWordIndex, isDeleting, words, typeSpeed, deleteSpeed, pauseDuration]);

  return displayText;
};