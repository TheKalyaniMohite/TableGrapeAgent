'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';

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

    // Listen for language changes from sticky selector
    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {getTranslation('onboarding.details.title', lang)}
            </h1>
          </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-3 text-lg">
              {getTranslation('onboarding.details.variety', lang)}
            </label>
            <div className="space-y-2">
              {VARIETY_OPTIONS.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="variety"
                    value={option}
                    checked={variety === option}
                    onChange={(e) => setVariety(e.target.value)}
                    className="mr-3 h-4 w-4 text-gray-900"
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
                className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-3 text-lg">
              {getTranslation('onboarding.details.irrigation', lang)}
            </label>
            <div className="space-y-2">
              {IRRIGATION_OPTIONS.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="irrigation"
                    value={option}
                    checked={irrigation === option}
                    onChange={(e) => setIrrigation(e.target.value)}
                    className="mr-3 h-4 w-4 text-gray-900"
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
                className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {saving ? getTranslation('common.loading', lang) : getTranslation('onboarding.details.continue', lang)}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

