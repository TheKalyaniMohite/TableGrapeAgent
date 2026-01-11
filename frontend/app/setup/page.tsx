'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LanguageToggle from '@/app/components/LanguageToggle';
import { getFarmsList, FarmListItem } from '@/app/lib/farmStorage';

export default function SetupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmsList, setFarmsList] = useState<FarmListItem[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

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
  }, []);

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  const handleSwitchFarm = () => {
    if (selectedFarmId) {
      localStorage.setItem('farm_id', selectedFarmId);
      setFarmId(selectedFarmId);
    }
  };

  const handleStartNewSetup = () => {
    localStorage.removeItem('farm_id');
    router.push('/onboarding/location');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav lang={lang} />
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {getTranslation('setup.title', lang)}
            </h1>
            <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card A: Already have setup */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                {getTranslation('setup.alreadyHave', lang)}
              </h2>
              
              {farmId ? (
                <div className="space-y-4">
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 text-lg font-medium"
                  >
                    {getTranslation('setup.continueDashboard', lang)}
                  </button>
                  
                  {farmsList.length > 1 && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        {getTranslation('setup.switchFarm', lang)}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedFarmId}
                          onChange={(e) => setSelectedFarmId(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 caret-gray-900"
                        >
                          {farmsList.map(farm => (
                            <option key={farm.id} value={farm.id}>
                              {farm.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleSwitchFarm}
                          disabled={selectedFarmId === farmId}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {getTranslation('setup.switch', lang)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-700">
                  {getTranslation('setup.noSavedFarm', lang)}
                </p>
              )}
            </div>

            {/* Card B: Add new farm */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                {getTranslation('setup.addNewFarm', lang)}
              </h2>
              <p className="text-gray-800 mb-4">
                {getTranslation('setup.addNewFarmDesc', lang)}
              </p>
              <button
                onClick={handleStartNewSetup}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 text-lg font-medium"
              >
                {getTranslation('setup.startNewSetup', lang)}
              </button>
            </div>
          </div>

          {/* Advanced link */}
          <div className="text-center">
            <a
              href="/setup/advanced"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {getTranslation('setup.advancedManual', lang)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
