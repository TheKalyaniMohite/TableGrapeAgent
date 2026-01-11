'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, GeocodeResult } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LanguageToggle from '@/app/components/LanguageToggle';
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

  const handleFarmSubmit = async (e: React.FormEvent) => {
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

  const handleBlocksSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-gray-50">
      <Nav lang={lang} />
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {getTranslation('setup.title', lang)} - {getTranslation('setup.advanced', lang)}
            </h1>
            <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 'farm' && (
            <form onSubmit={handleFarmSubmit} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                {getTranslation('setup.createFarm', lang)}
              </h2>

              <div className="mb-4">
                <label className="block text-gray-800 font-medium mb-2">
                  {getTranslation('setup.farmName', lang)}
                </label>
                <input
                  type="text"
                  value={farmForm.name}
                  onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-800 font-medium mb-2">
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
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {showAdvanced ? '▼' : '▶'} {getTranslation('setup.advancedLocation', lang)}
                </button>
                
                {showAdvanced && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="mb-3">
                      <label className="block text-gray-800 font-medium mb-2">
                        {getTranslation('setup.latitude', lang)}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={farmForm.lat}
                        onChange={(e) => setFarmForm({ ...farmForm, lat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                        placeholder="-90 to 90"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-800 font-medium mb-2">
                        {getTranslation('setup.longitude', lang)}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={farmForm.lon}
                        onChange={(e) => setFarmForm({ ...farmForm, lon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                        placeholder="-180 to 180"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-800 font-medium mb-2">
                  {getTranslation('setup.countryCode', lang)}
                </label>
                <input
                  type="text"
                  value={farmForm.country_code}
                  onChange={(e) => setFarmForm({ ...farmForm, country_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-800 font-medium mb-2">
                  {getTranslation('setup.preferredLanguage', lang)}
                </label>
                <select
                  value={farmForm.preferred_language}
                  onChange={(e) => {
                    setFarmForm({ ...farmForm, preferred_language: e.target.value });
                    setLang(e.target.value as Language);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 caret-gray-900"
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
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? getTranslation('common.loading', lang) : getTranslation('common.save', lang)}
              </button>
            </form>
          )}

          {step === 'blocks' && (
            <form onSubmit={handleBlocksSubmit} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                {getTranslation('setup.createBlocks', lang)}
              </h2>

              {blocks.map((block, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md">
                  <h3 className="font-semibold mb-3 text-gray-900">Block {index + 1}</h3>

                  <div className="mb-3">
                    <label className="block text-gray-800 font-medium mb-1">
                      {getTranslation('setup.blockName', lang)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={block.name}
                      onChange={(e) => updateBlock(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-gray-800 font-medium mb-1">
                      {getTranslation('setup.variety', lang)}
                    </label>
                    <input
                      type="text"
                      value={block.variety}
                      onChange={(e) => updateBlock(index, 'variety', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-gray-800 font-medium mb-1">
                        {getTranslation('setup.plantingYear', lang)}
                      </label>
                      <input
                        type="number"
                        value={block.planting_year}
                        onChange={(e) => updateBlock(index, 'planting_year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 font-medium mb-1">
                        {getTranslation('setup.soilType', lang)}
                      </label>
                      <input
                        type="text"
                        value={block.soil_type}
                        onChange={(e) => updateBlock(index, 'soil_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-gray-800 font-medium mb-1">
                      {getTranslation('setup.irrigationType', lang)}
                    </label>
                    <input
                      type="text"
                      value={block.irrigation_type}
                      onChange={(e) => updateBlock(index, 'irrigation_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlock}
                className="mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                {getTranslation('setup.addBlock', lang)}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
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

