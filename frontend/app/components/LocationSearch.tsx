'use client';

import { useState } from 'react';
import { api, GeocodeResult } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';

interface LocationSearchProps {
  city: string;
  state: string;
  country: string;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onLocationSelect: (location: GeocodeResult) => void;
  selectedLocation: GeocodeResult | null;
  lang: Language;
}

export default function LocationSearch({
  city,
  state,
  country,
  onCityChange,
  onStateChange,
  onCountryChange,
  onLocationSelect,
  selectedLocation,
  lang,
}: LocationSearchProps) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      setError('City is required');
      return;
    }

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await api.geocode(city.trim(), state.trim() || undefined, country.trim() || undefined);
      setResults(response.results);
      setShowResults(true);
      
      if (response.results.length === 0) {
        setError('No locations found. Try a different search.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search location');
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (location: GeocodeResult) => {
    onLocationSelect(location);
    setShowResults(false);
    setError(null);
  };

  const formatLocationName = (location: GeocodeResult): string => {
    const parts = [location.name];
    if (location.admin1) parts.push(location.admin1);
    if (location.country) parts.push(location.country);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('setup.city', lang)} *
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
            placeholder={getTranslation('setup.cityPlaceholder', lang)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('setup.state', lang)}
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
            placeholder={getTranslation('setup.statePlaceholder', lang)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('setup.country', lang)}
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
            placeholder={getTranslation('setup.countryPlaceholder', lang)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={searching || !city.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {searching ? getTranslation('common.searching', lang) : getTranslation('setup.findLocation', lang)}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
          {results.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(location)}
              className={`w-full text-left px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 ${
                selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude
                  ? 'bg-green-50 border-green-300'
                  : ''
              }`}
            >
              <div className="font-medium">{formatLocationName(location)}</div>
              <div className="text-sm text-gray-700">
                {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLocation && (
        <div className="bg-green-50 border border-green-300 rounded-md p-3">
          <div className="text-sm text-gray-700">
            <strong>{getTranslation('setup.selectedLocation', lang)}:</strong> {formatLocationName(selectedLocation)}
          </div>
          <div className="text-xs text-gray-700 mt-1">
            {getTranslation('setup.coordinates', lang)}: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}

