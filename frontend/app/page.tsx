'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const farmId = localStorage.getItem('farm_id');
    if (farmId) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding/location');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-700">Loading...</p>
    </div>
  );
}

