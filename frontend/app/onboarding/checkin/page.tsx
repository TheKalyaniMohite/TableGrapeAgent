'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, CropStatus } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import LanguageToggle from '@/app/components/LanguageToggle';
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
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {getTranslation('onboarding.checkin.title', lang)}
          </h1>
          <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
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
  );
}

