'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, GeocodeResult } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LocationSearch from '@/app/components/LocationSearch';
import { addFarmToList } from '@/app/lib/farmStorage';

interface BlockForm {
  name: string;
  variety: string;
  planting_year: string;
  soil_type: string;
  irrigation_type: string;
}

export default function AdvancedSetupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<'farm' | 'blocks'>('farm');
  
  const [farmForm, setFarmForm] = useState({
    name: '',
    lat: '',
    lon: '',
    country_code: '',
    preferred_language: 'en',
  });

  const [locationInputs, setLocationInputs] = useState({
    city: '',
    state: '',
    country: '',
  });

  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [blocks, setBlocks] = useState<BlockForm[]>([
    { name: '', variety: '', planting_year: '', soil_type: '', irrigation_type: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    setLang(storedLang as Language);

    // Listen for language changes from sticky selector
    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const handleLocationSelect = (location: GeocodeResult) => {
    setSelectedLocation(location);
    setFarmForm({
      ...farmForm,
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
    });
    // Auto-fill country code if available
    if (location.country && !farmForm.country_code) {
      setFarmForm(prev => ({ ...prev, country_code: location.country }));
    }
  };

  const handleFarmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate coordinates
    if (!farmForm.lat || !farmForm.lon) {
      setError('Please select a location or enter coordinates manually');
      return;
    }

    const lat = parseFloat(farmForm.lat);
    const lon = parseFloat(farmForm.lon);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Invalid coordinates. Please check your input.');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Coordinates out of range. Latitude must be -90 to 90, Longitude must be -180 to 180.');
      return;
    }

    setLoading(true);

    try {
      const farm = await api.createFarm({
        name: farmForm.name || null,
        lat,
        lon,
        country_code: farmForm.country_code || undefined,
        preferred_language: farmForm.preferred_language,
      });

      localStorage.setItem('farm_id', farm.id);
      localStorage.setItem('preferred_language', farm.preferred_language);
      
      // Add to farms list
      const locationInfo = selectedLocation 
        ? `${selectedLocation.name}, ${selectedLocation.admin1}, ${selectedLocation.country}`
        : undefined;
      addFarmToList(farm.id, farm.name || null, locationInfo);
      
      setLang(farm.preferred_language as Language);
      setStep('blocks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm');
    } finally {
      setLoading(false);
    }
  };

  const handleBlocksSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      setError('Farm ID not found');
      setLoading(false);
      return;
    }

    try {
      for (const block of blocks) {
        if (block.name.trim()) {
          await api.createBlock({
            farm_id: farmId,
            name: block.name,
            variety: block.variety || undefined,
            planting_year: block.planting_year ? parseInt(block.planting_year) : undefined,
            soil_type: block.soil_type || undefined,
            irrigation_type: block.irrigation_type || undefined,
          });
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blocks');
    } finally {
      setLoading(false);
    }
  };

  const addBlock = () => {
    setBlocks([...blocks, { name: '', variety: '', planting_year: '', soil_type: '', irrigation_type: '' }]);
  };

  const updateBlock = (index: number, field: keyof BlockForm, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index][field] = value;
    setBlocks(newBlocks);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <Nav lang={lang} />
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
              {getTranslation('setup.title', lang)}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">{getTranslation('setup.advanced', lang)}</p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'farm' && (
            <form onSubmit={handleFarmSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                {getTranslation('setup.createFarm', lang)}
              </h2>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  {getTranslation('setup.farmName', lang)}
                </label>
                <input
                  type="text"
                  value={farmForm.name}
                  onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter farm name (optional)"
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  {getTranslation('setup.cityStateCountry', lang)}
                </label>
                <LocationSearch
                  city={locationInputs.city}
                  state={locationInputs.state}
                  country={locationInputs.country}
                  onCityChange={(value) => setLocationInputs({ ...locationInputs, city: value })}
                  onStateChange={(value) => setLocationInputs({ ...locationInputs, state: value })}
                  onCountryChange={(value) => setLocationInputs({ ...locationInputs, country: value })}
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  lang={lang}
                />
              </div>

              {/* Advanced: Manual coordinates */}
              <div className="mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs sm:text-sm text-gray-600 hover:text-green-600 font-medium flex items-center gap-1.5 sm:gap-2 transition-colors"
                >
                  {showAdvanced ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {getTranslation('setup.advancedLocation', lang)}
                </button>
                
                {showAdvanced && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        {getTranslation('setup.latitude', lang)}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={farmForm.lat}
                        onChange={(e) => setFarmForm({ ...farmForm, lat: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="-90 to 90"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        {getTranslation('setup.longitude', lang)}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={farmForm.lon}
                        onChange={(e) => setFarmForm({ ...farmForm, lon: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="-180 to 180"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  {getTranslation('setup.countryCode', lang)}
                </label>
                <input
                  type="text"
                  value={farmForm.country_code}
                  onChange={(e) => setFarmForm({ ...farmForm, country_code: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., US, IN, ES"
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  {getTranslation('setup.preferredLanguage', lang)}
                </label>
                <select
                  value={farmForm.preferred_language}
                  onChange={(e) => {
                    setFarmForm({ ...farmForm, preferred_language: e.target.value });
                    setLang(e.target.value as Language);
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? getTranslation('common.loading', lang) : getTranslation('common.save', lang)}
              </button>
            </form>
          )}

          {step === 'blocks' && (
            <form onSubmit={handleBlocksSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-100">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {getTranslation('setup.createBlocks', lang)}
                </h2>
              </div>

              {blocks.map((block, index) => (
                <div key={index} className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-5 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Block {index + 1}</h3>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      {getTranslation('setup.blockName', lang)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={block.name}
                      onChange={(e) => updateBlock(index, 'name', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Enter block name"
                    />
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      {getTranslation('setup.variety', lang)}
                    </label>
                    <input
                      type="text"
                      value={block.variety}
                      onChange={(e) => updateBlock(index, 'variety', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="e.g., Thompson Seedless"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        {getTranslation('setup.plantingYear', lang)}
                      </label>
                      <input
                        type="number"
                        value={block.planting_year}
                        onChange={(e) => updateBlock(index, 'planting_year', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="e.g., 2020"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        {getTranslation('setup.soilType', lang)}
                      </label>
                      <input
                        type="text"
                        value={block.soil_type}
                        onChange={(e) => updateBlock(index, 'soil_type', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="e.g., Loam"
                      />
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      {getTranslation('setup.irrigationType', lang)}
                    </label>
                    <input
                      type="text"
                      value={block.irrigation_type}
                      onChange={(e) => updateBlock(index, 'irrigation_type', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="e.g., Drip irrigation"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlock}
                className="mb-4 sm:mb-6 w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {getTranslation('setup.addBlock', lang)}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? getTranslation('common.loading', lang) : getTranslation('setup.saveAndContinue', lang)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
