'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, GeocodeResult } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import { addFarmToList } from '@/app/lib/farmStorage';

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  
  const [locationInputs, setLocationInputs] = useState({
    country: '',
    state: '',
    district: '',
    village: '',
  });

  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Try to detect country from browser locale
    if (!locationInputs.country) {
      const locale = navigator.language || 'en';
      if (locale.startsWith('hi') || locale.includes('IN')) {
        setLocationInputs(prev => ({ ...prev, country: 'India' }));
      }
    }
    
    // Get preferred language from localStorage if available
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
  }, []);

  const handleSearch = async () => {
    if (!locationInputs.country.trim()) {
      setError('Please enter a country');
      return;
    }

    if (!locationInputs.state.trim()) {
      setError('Please enter a state');
      return;
    }

    if (!locationInputs.village.trim()) {
      setError('Please enter a village or town name');
      return;
    }

    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedLocation(null);

    try {
      const response = await api.geocode(
        locationInputs.village.trim(),
        locationInputs.state.trim(),
        locationInputs.country.trim(),
        locationInputs.district.trim() || undefined,
        10
      );
      
      setResults(response.results);
      
      if (response.results.length === 0) {
        setError(getTranslation('onboarding.location.noResults', lang));
      }
    } catch (err) {
      setError(getTranslation('onboarding.location.noResults', lang));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (location: GeocodeResult) => {
    setSelectedLocation(location);
    setError(null);
  };

  const handleNext = async () => {
    if (!selectedLocation) {
      setError('Please select a location');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Create farm
      const farm = await api.createFarm({
        name: null, // Will be set to "My Farm" by backend
        lat: selectedLocation.latitude,
        lon: selectedLocation.longitude,
        country_code: selectedLocation.country_code || undefined,
        preferred_language: lang,
      });

      localStorage.setItem('farm_id', farm.id);
      localStorage.setItem('preferred_language', lang);
      
      // Add to farms list
      const locationInfo = `${selectedLocation.name}, ${selectedLocation.admin1}, ${selectedLocation.country}`;
      addFarmToList(farm.id, farm.name || null, locationInfo);
      
      // Route to details page
      router.push('/onboarding/details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm');
      setCreating(false);
    }
  };

  const formatLocationName = (location: GeocodeResult): string => {
    const parts = [location.name];
    if (location.admin1) parts.push(location.admin1);
    if (location.country) parts.push(location.country);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {getTranslation('onboarding.location.title', lang)}
            </h1>
          </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          {/* Country - First */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {getTranslation('onboarding.location.country', lang)} *
            </label>
            <input
              type="text"
              required
              value={locationInputs.country}
              onChange={(e) => setLocationInputs({ ...locationInputs, country: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={getTranslation('onboarding.location.countryPlaceholder', lang)}
            />
          </div>

          {/* State - Second */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {getTranslation('onboarding.location.state', lang)} *
            </label>
            <input
              type="text"
              required
              value={locationInputs.state}
              onChange={(e) => setLocationInputs({ ...locationInputs, state: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={getTranslation('onboarding.location.statePlaceholder', lang)}
            />
          </div>

          {/* District - Third (optional) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {getTranslation('onboarding.location.district', lang)} ({getTranslation('common.optional', lang)})
            </label>
            <input
              type="text"
              value={locationInputs.district}
              onChange={(e) => setLocationInputs({ ...locationInputs, district: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={getTranslation('onboarding.location.districtPlaceholder', lang)}
            />
          </div>

          {/* Village/Town - Last */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {getTranslation('onboarding.location.village', lang)} *
            </label>
            <input
              type="text"
              required
              value={locationInputs.village}
              onChange={(e) => setLocationInputs({ ...locationInputs, village: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={getTranslation('onboarding.location.villagePlaceholder', lang)}
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !locationInputs.country.trim() || !locationInputs.state.trim() || !locationInputs.village.trim()}
            className="w-full bg-gray-900 text-white py-3.5 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? getTranslation('common.searching', lang) : getTranslation('onboarding.location.findLocation', lang)}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {getTranslation('onboarding.location.selectLocation', lang)}
            </h2>
            <div className="space-y-3 mb-4">
              {results.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectLocation(location)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude
                      ? 'bg-gray-100 border-gray-900'
                      : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  } cursor-pointer`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude}
                      onChange={() => handleSelectLocation(location)}
                      className="mt-1 mr-3 h-5 w-5 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-800 mb-1">
                        {formatLocationName(location)}
                      </div>
                      <div className="text-sm text-gray-700">
                        Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedLocation && (
              <button
                type="button"
                onClick={handleNext}
                disabled={creating}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
              >
                {creating ? getTranslation('common.loading', lang) : getTranslation('onboarding.location.next', lang)}
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
