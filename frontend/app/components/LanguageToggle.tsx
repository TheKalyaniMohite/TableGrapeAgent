'use client';

import { Language } from '@/app/lib/i18n';

interface LanguageToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageToggle({ currentLang, onLanguageChange }: LanguageToggleProps) {
  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'es', label: 'Español' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-gray-800">Language:</span>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`px-3 py-1 rounded text-sm ${
            currentLang === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

