'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, GeocodeResult } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import { addFarmToList } from '@/app/lib/farmStorage';
import { countries, getStates, getCities, getCountryCode, State, City } from '@/app/lib/locationData';

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  
  const [locationInputs, setLocationInputs] = useState({
    country: '',
    state: '',
    district: '',
    village: '',
  });

  // Cascading dropdown states
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);

  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
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

  // Update states when country changes
  useEffect(() => {
    if (locationInputs.country) {
      const states = getStates(locationInputs.country);
      setAvailableStates(states);
      // Reset state and city when country changes
      setLocationInputs(prev => ({ ...prev, state: '', village: '' }));
      setAvailableCities([]);
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  }, [locationInputs.country]);

  // Update cities when state changes
  useEffect(() => {
    if (locationInputs.country && locationInputs.state) {
      const cities = getCities(locationInputs.country, locationInputs.state);
      setAvailableCities(cities);
      // Reset city when state changes
      setLocationInputs(prev => ({ ...prev, village: '' }));
    } else {
      setAvailableCities([]);
    }
  }, [locationInputs.state, locationInputs.country]);

  const handleCountryChange = (country: string) => {
    setLocationInputs(prev => ({ ...prev, country, state: '', village: '' }));
    setResults([]);
    setSelectedLocation(null);
    setError(null);
  };

  const handleStateChange = (state: string) => {
    setLocationInputs(prev => ({ ...prev, state, village: '' }));
    setResults([]);
    setSelectedLocation(null);
    setError(null);
  };

  const handleCityChange = (village: string) => {
    setLocationInputs(prev => ({ ...prev, village }));
    setResults([]);
    setSelectedLocation(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!locationInputs.country.trim()) {
      setError('Please select a country');
      return;
    }

    if (!locationInputs.state.trim()) {
      setError('Please select a state');
      return;
    }

    if (!locationInputs.village.trim()) {
      setError('Please select a city/town');
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
      } else if (response.results.length === 1) {
        // Auto-select if only one result
        setSelectedLocation(response.results[0]);
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
      const countryCode = getCountryCode(locationInputs.country) || selectedLocation.country_code;
      const farm = await api.createFarm({
        name: null, // Will be set to "My Farm" by backend
        lat: selectedLocation.latitude,
        lon: selectedLocation.longitude,
        country_code: countryCode || undefined,
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              {getTranslation('onboarding.location.title', lang)}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Select your farm location from the dropdowns below
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
            {/* Country Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                {getTranslation('onboarding.location.country', lang)} *
              </label>
              <select
                value={locationInputs.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="">Select a country...</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                {getTranslation('onboarding.location.state', lang)} *
              </label>
              <select
                value={locationInputs.state}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!locationInputs.country}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="">
                  {locationInputs.country ? 'Select a state/region...' : 'First select a country'}
                </option>
                {availableStates.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City/Town Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                {getTranslation('onboarding.location.village', lang)} *
              </label>
              <select
                value={locationInputs.village}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!locationInputs.state}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="">
                  {locationInputs.state ? 'Select a city/town...' : 'First select a state'}
                </option>
                {availableCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District - Optional text input */}
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                {getTranslation('onboarding.location.district', lang)} ({getTranslation('common.optional', lang)})
              </label>
              <input
                type="text"
                value={locationInputs.district}
                onChange={(e) => setLocationInputs({ ...locationInputs, district: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={getTranslation('onboarding.location.districtPlaceholder', lang)}
              />
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !locationInputs.country || !locationInputs.state || !locationInputs.village}
              className="w-full bg-gray-900 text-white py-3.5 px-6 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getTranslation('common.searching', lang)}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {getTranslation('onboarding.location.findLocation', lang)}
                </>
              )}
            </button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {getTranslation('onboarding.location.selectLocation', lang)}
              </h2>
              <div className="space-y-3 mb-4">
                {results.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectLocation(location)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } cursor-pointer`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {formatLocationName(location)}
                        </div>
                        <div className="text-xs text-gray-500">
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
                  className="w-full bg-emerald-600 text-white py-3.5 px-6 rounded-xl font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {getTranslation('common.loading', lang)}
                    </>
                  ) : (
                    <>
                      {getTranslation('onboarding.location.next', lang)}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
