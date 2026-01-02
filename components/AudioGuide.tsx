'use client';

import { useState } from 'react';
import { translations, type Language } from '@/lib/translations';

interface AudioGuideProps {
  language: Language;
  text: string;
}

export default function AudioGuide({ language, text }: AudioGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Only show audio guide for English
  if (language !== 'en') {
    return null;
  }

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <button
      onClick={isPlaying ? stopAudio : playAudio}
      className="flex items-center gap-2 rounded-lg px-4 py-2 text-white text-sm font-medium transition-opacity"
      style={{ backgroundColor: '#5DA9E9' }}
      aria-label="Audio Guide"
    >
      <svg
        className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isPlaying ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        )}
      </svg>
      {isPlaying ? 'Stop' : 'Audio Guide'}
    </button>
  );
}

