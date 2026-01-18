'use client';

import { useState, useEffect } from 'react';
import { Language } from '@/app/lib/i18n';
import US from 'country-flag-icons/react/3x2/US';
import IN from 'country-flag-icons/react/3x2/IN';
import ES from 'country-flag-icons/react/3x2/ES';
import FR from 'country-flag-icons/react/3x2/FR';
import DE from 'country-flag-icons/react/3x2/DE';
import PT from 'country-flag-icons/react/3x2/PT';
import CN from 'country-flag-icons/react/3x2/CN';
import JP from 'country-flag-icons/react/3x2/JP';
import SA from 'country-flag-icons/react/3x2/SA';

type FlagComponent = React.ComponentType<any>;

interface LanguageOption {
  code: Language;
  label: string;
  FlagComponent: FlagComponent;
}

const languages: LanguageOption[] = [
  { code: 'en', label: 'English', FlagComponent: US },
  { code: 'hi', label: 'हिंदी', FlagComponent: IN },
  { code: 'es', label: 'Español', FlagComponent: ES },
  { code: 'mr', label: 'मराठी', FlagComponent: IN },
  { code: 'fr', label: 'Français', FlagComponent: FR },
  { code: 'de', label: 'Deutsch', FlagComponent: DE },
  { code: 'pt', label: 'Português', FlagComponent: PT },
  { code: 'zh', label: '中文', FlagComponent: CN },
  { code: 'ja', label: '日本語', FlagComponent: JP },
  { code: 'ar', label: 'العربية', FlagComponent: SA },
];

export default function StickyLanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    setCurrentLang(savedLang as Language);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('preferred_language', lang);
    setIsOpen(false);
    
    // Trigger a custom event so pages can update their language state
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];
  const CurrentFlag = currentLanguage.FlagComponent;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <div className="relative">
        {/* Language selector button - smaller on mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-3 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:border-gray-400 transition-all duration-200 hover:shadow-xl min-w-[48px] sm:min-w-[60px]"
          aria-label="Select language"
        >
          <div 
            className="w-5 h-3.5 sm:w-6 sm:h-4 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-sm"
            aria-label={`${currentLanguage.label} flag`}
          >
            <CurrentFlag className="w-full h-full" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline-block whitespace-nowrap">
            {currentLanguage.label}
          </span>
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop to close on click outside */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown - Full width on mobile, positioned above button */}
            <div className="absolute bottom-full right-0 mb-2 w-48 sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[60vh] sm:max-h-80 overflow-y-auto">
              <div className="p-1.5 sm:p-2">
                {languages.map((lang) => {
                  const Flag = lang.FlagComponent;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left transition-all duration-150 ${
                        currentLang === lang.code
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        className="w-5 h-3.5 sm:w-6 sm:h-4 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-sm"
                        aria-label={`${lang.label} flag`}
                      >
                        <Flag className="w-full h-full" />
                      </div>
                      <span className="text-xs sm:text-sm flex-1 text-left">{lang.label}</span>
                      {currentLang === lang.code && (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
