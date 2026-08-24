import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    
    if (text.length === 0) {
      setIsTyping(false);
      return;
    }

    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = () => {
    setDisplayedText(text);
    setIsTyping(false);
  };

  return { displayedText, isTyping, skip };
};
