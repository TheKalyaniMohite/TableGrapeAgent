'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, CropStatus } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import CheckInForm from '@/app/components/CheckInForm';

export default function OnboardingCheckInPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [latestStatus, setLatestStatus] = useState<CropStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedFarmId = localStorage.getItem('farm_id');
    if (!storedFarmId) {
      router.push('/onboarding/location');
      return;
    }

    setFarmId(storedFarmId);

    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang) {
      setLang(storedLang as Language);
    }

    // Fetch latest status (will be null for new farms)
    api.getLatestStatus(storedFarmId)
      .then(status => setLatestStatus(status))
      .catch(() => setLatestStatus(null))
      .finally(() => setLoading(false));

    // Listen for language changes from sticky selector
    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [router]);

  const handleCheckInSuccess = () => {
    // Navigate to dashboard after successful check-in
    router.push('/dashboard');
  };

  if (loading || !farmId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8 max-w-2xl">
          <div className="text-center">
            <p>{getTranslation('common.loading', lang)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {getTranslation('onboarding.checkin.title', lang)}
            </h1>
          </div>

          <CheckInForm
            farmId={farmId}
            latestStatus={latestStatus}
            lang={lang}
            onSuccess={handleCheckInSuccess}
            onboardingMode={true}
          />
        </div>
      </div>
    </div>
  );
}

