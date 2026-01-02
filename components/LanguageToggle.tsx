'use client';

import { Language } from '@/lib/translations';

interface LanguageToggleProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageToggle({ currentLanguage, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium" style={{ color: '#123C66' }}>Language / భాష:</label>
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
        style={{
          border: '1px solid #D6E2EE',
          backgroundColor: '#FFFFFF',
          color: '#123C66',
          '--tw-ring-color': '#1F6FB2'
        } as React.CSSProperties}
      >
        <option value="en">English</option>
        <option value="te">తెలుగు</option>
      </select>
    </div>
  );
}

