'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import { getFarmsList, FarmListItem } from '@/app/lib/farmStorage';

export default function SetupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmsList, setFarmsList] = useState<FarmListItem[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [showFarmSelector, setShowFarmSelector] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    setLang(storedLang as Language);
    
    const storedFarmId = localStorage.getItem('farm_id');
    setFarmId(storedFarmId);
    
    const farms = getFarmsList();
    setFarmsList(farms);
    if (storedFarmId) {
      setSelectedFarmId(storedFarmId);
    }

    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  const handleSwitchFarm = (newFarmId: string) => {
    if (newFarmId && newFarmId !== farmId) {
      localStorage.setItem('farm_id', newFarmId);
      setFarmId(newFarmId);
      setSelectedFarmId(newFarmId);
    }
  };

  const handleStartNewSetup = () => {
    localStorage.removeItem('farm_id');
    router.push('/onboarding/location');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Nav lang={lang} />
      
      <div className="flex-1 flex flex-col justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-6">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2 tracking-tight">
              {getTranslation('setup.title', lang)}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto px-4">
              Manage your farms and get personalized insights
            </p>
          </div>

          {/* Action Cards - Clickable cards with integrated buttons */}
          <div className={`grid gap-4 sm:gap-6 ${farmId ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
            {/* Continue to Dashboard Card */}
            {farmId && (
              <button
                onClick={handleContinueToDashboard}
                className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left border-2 border-gray-200 transition-all duration-300 hover:bg-gray-900 hover:border-gray-900 hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-900/20 active:scale-[0.98]"
              >
                {/* Switch Farm - only if multiple farms */}
                {farmsList.length > 1 && (
                  <div className="relative mb-4">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFarmSelector(!showFarmSelector);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-400 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>{getTranslation('setup.switchFarm', lang)}</span>
                    </div>
                    
                    {showFarmSelector && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full left-0 mt-2 min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-10"
                      >
                        {farmsList.filter(f => f.id !== farmId).map(farm => (
                          <button
                            key={farm.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchFarm(farm.id);
                              setShowFarmSelector(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {farm.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-100 group-hover:bg-white/10 flex items-center justify-center mb-4 transition-colors duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300">
                      {getTranslation('setup.continueDashboard', lang)}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors duration-300">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-500 group-hover:text-gray-400 text-sm sm:text-base mb-4 transition-colors duration-300">Continue where you left off</p>
                  
                  <div className="flex items-center gap-2 text-gray-900 group-hover:text-white font-medium transition-colors duration-300">
                    <span className="text-sm">Go to Dashboard</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {/* Add New Farm Card */}
            <button
              onClick={handleStartNewSetup}
              className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left border-2 border-gray-200 transition-all duration-300 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-900/10 active:scale-[0.98]"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-100 group-hover:bg-emerald-500 flex items-center justify-center mb-4 transition-colors duration-300">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {getTranslation('setup.addNewFarm', lang)}
              </h2>
              <p className="text-gray-500 group-hover:text-emerald-700/70 text-sm sm:text-base mb-4 transition-colors duration-300">
                {getTranslation('setup.addNewFarmDesc', lang)}
              </p>
              
              <div className="flex items-center gap-2 text-gray-900 group-hover:text-emerald-700 font-medium transition-colors duration-300">
                <span className="text-sm">Start Setup</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>

          {/* Advanced Option */}
          <div className="text-center mt-4 sm:mt-6">
            <a
              href="/setup/advanced"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors group"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{getTranslation('setup.advancedManual', lang)}</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
