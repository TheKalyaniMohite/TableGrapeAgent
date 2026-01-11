'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import LanguageToggle from '@/app/components/LanguageToggle';

const VARIETY_OPTIONS = [
  'Thompson Seedless',
  'Red Globe',
  'Crimson Seedless',
  'Black Seedless',
  'Other',
];

const IRRIGATION_OPTIONS = [
  'Drip',
  'Flood',
  'Sprinkler',
  'Rain-fed',
  'Other',
];

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  
  const [variety, setVariety] = useState('');
  const [varietyOther, setVarietyOther] = useState('');
  const [irrigation, setIrrigation] = useState('');
  const [irrigationOther, setIrrigationOther] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
      return;
    }

    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang) {
      setLang(storedLang as Language);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      setError('Farm ID not found');
      setSaving(false);
      return;
    }

    try {
      // Create default block with variety and irrigation
      await api.createBlock({
        farm_id: farmId,
        name: 'Main Block',
        variety: variety === 'Other' ? varietyOther : variety || undefined,
        irrigation_type: irrigation === 'Other' ? irrigationOther : irrigation || undefined,
      });

      // Route to check-in page
      router.push('/onboarding/checkin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save details');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {getTranslation('onboarding.details.title', lang)}
          </h1>
          <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-3 text-lg">
              {getTranslation('onboarding.details.variety', lang)}
            </label>
            <div className="space-y-2">
              {VARIETY_OPTIONS.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="variety"
                    value={option}
                    checked={variety === option}
                    onChange={(e) => setVariety(e.target.value)}
                    className="mr-3 h-4 w-4 text-green-600"
                  />
                  <span className="text-gray-700">
                    {option === 'Other' ? getTranslation('onboarding.details.variety.other', lang) : option}
                  </span>
                </label>
              ))}
            </div>
            {variety === 'Other' && (
              <input
                type="text"
                value={varietyOther}
                onChange={(e) => setVarietyOther(e.target.value)}
                placeholder="Enter variety name"
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg text-gray-900 placeholder:text-gray-400 caret-gray-900"
              />
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-3 text-lg">
              {getTranslation('onboarding.details.irrigation', lang)}
            </label>
            <div className="space-y-2">
              {IRRIGATION_OPTIONS.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="irrigation"
                    value={option}
                    checked={irrigation === option}
                    onChange={(e) => setIrrigation(e.target.value)}
                    className="mr-3 h-4 w-4 text-green-600"
                  />
                  <span className="text-gray-700">
                    {option === 'Other' ? getTranslation('onboarding.details.irrigation.other', lang) : option}
                  </span>
                </label>
              ))}
            </div>
            {irrigation === 'Other' && (
              <input
                type="text"
                value={irrigationOther}
                onChange={(e) => setIrrigationOther(e.target.value)}
                placeholder="Enter irrigation type"
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg text-gray-900 placeholder:text-gray-400 caret-gray-900"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-lg font-medium"
          >
            {saving ? getTranslation('common.loading', lang) : getTranslation('onboarding.details.continue', lang)}
          </button>
        </form>
      </div>
    </div>
  );
}

