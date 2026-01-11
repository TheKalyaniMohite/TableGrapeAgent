'use client';

import { useState } from 'react';
import { api, CropStatus } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';

interface CheckInFormProps {
  farmId: string;
  latestStatus: CropStatus | null;
  lang: Language;
  onSuccess: () => void;
  onboardingMode?: boolean;
}

const STAGE_OPTIONS = [
  { value: 'early_growth', label: 'Early growth' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruit_set', label: 'Small grapes (fruit set)' },
  { value: 'veraison', label: 'Color change (veraison)' },
  { value: 'harvest', label: 'Harvest' },
];

const IRRIGATION_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '2_3_days', label: '2–3 days ago' },
  { value: '4plus_days', label: '4+ days ago' },
  { value: 'dont_know', label: "Don't know" },
];

const SPRAY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fungus_spray', label: 'Fungus spray' },
  { value: 'nutrient_spray', label: 'Nutrient spray' },
  { value: 'pest_spray', label: 'Pest spray' },
  { value: 'dont_know', label: "Don't know" },
];

export default function CheckInForm({ farmId, latestStatus, lang, onSuccess, onboardingMode = false }: CheckInFormProps) {
  const [formData, setFormData] = useState({
    stage: latestStatus?.stage || 'early_growth',
    sweetness_brix: latestStatus?.sweetness_brix?.toString() || '',
    brixUnknown: latestStatus?.sweetness_brix === undefined,
    cracking: latestStatus?.cracking || false,
    sunburn: latestStatus?.sunburn || false,
    mildew_signs: latestStatus?.mildew_signs || false,
    botrytis_signs: latestStatus?.botrytis_signs || false,
    pest_signs: latestStatus?.pest_signs || false,
    last_irrigation: latestStatus?.last_irrigation || '',
    last_spray: latestStatus?.last_spray || '',
    notes: latestStatus?.notes || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!latestStatus || onboardingMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createCropStatus({
        farm_id: farmId,
        block_id: undefined, // Farm-level check-in
        stage: formData.stage,
        sweetness_brix: formData.brixUnknown ? undefined : (formData.sweetness_brix ? parseFloat(formData.sweetness_brix) : undefined),
        cracking: formData.cracking,
        sunburn: formData.sunburn,
        mildew_signs: formData.mildew_signs,
        botrytis_signs: formData.botrytis_signs,
        pest_signs: formData.pest_signs,
        last_irrigation: formData.last_irrigation || undefined,
        last_spray: formData.last_spray || undefined,
        notes: formData.notes || undefined,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (latestStatus && !showForm && !onboardingMode) {
    // Show existing status with update button
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          {getTranslation('dashboard.checkIn.title', lang)}
        </h2>
        <div className="space-y-2 mb-4">
          <div>
            <strong className="text-gray-800">{getTranslation('dashboard.checkIn.stage', lang)}:</strong>{' '}
            <span className="text-gray-800">{STAGE_OPTIONS.find(o => o.value === latestStatus.stage)?.label || latestStatus.stage}</span>
          </div>
          {latestStatus.sweetness_brix && (
            <div>
              <strong className="text-gray-800">{getTranslation('dashboard.checkIn.brix', lang)}:</strong>{' '}
              <span className="text-gray-800">{latestStatus.sweetness_brix}°Bx</span>
            </div>
          )}
          {(latestStatus.cracking || latestStatus.sunburn || latestStatus.mildew_signs || 
            latestStatus.botrytis_signs || latestStatus.pest_signs) && (
            <div>
              <strong className="text-gray-800">{getTranslation('dashboard.checkIn.issues', lang)}:</strong>{' '}
              <span className="text-gray-800">
                {[
                  latestStatus.cracking && getTranslation('dashboard.checkIn.cracking', lang),
                  latestStatus.sunburn && getTranslation('dashboard.checkIn.sunburn', lang),
                  latestStatus.mildew_signs && getTranslation('dashboard.checkIn.mildew', lang),
                  latestStatus.botrytis_signs && getTranslation('dashboard.checkIn.botrytis', lang),
                  latestStatus.pest_signs && getTranslation('dashboard.checkIn.pests', lang),
                ].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          {getTranslation('dashboard.checkIn.update', lang)}
        </button>
      </div>
    );
  }

  // Show form
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
        {latestStatus ? getTranslation('dashboard.checkIn.update', lang) : getTranslation('dashboard.checkIn.quick', lang)}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.stage', lang)} *
          </label>
          <select
            required
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
          >
            {STAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.brix', lang)}
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="number"
              step="0.1"
              value={formData.sweetness_brix}
              onChange={(e) => setFormData({ ...formData, sweetness_brix: e.target.value, brixUnknown: false })}
              disabled={formData.brixUnknown}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:placeholder:text-gray-400"
              placeholder="e.g., 15.5"
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.brixUnknown}
                onChange={(e) => setFormData({ ...formData, brixUnknown: e.target.checked, sweetness_brix: '' })}
                className="mr-2"
              />
              <span className="text-sm text-gray-800">{getTranslation('dashboard.checkIn.dontKnow', lang)}</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.symptoms', lang)}
          </label>
          <div className="space-y-2">
            {[
              { key: 'cracking', label: getTranslation('dashboard.checkIn.cracking', lang) },
              { key: 'sunburn', label: getTranslation('dashboard.checkIn.sunburn', lang) },
              { key: 'mildew_signs', label: getTranslation('dashboard.checkIn.mildew', lang) },
              { key: 'botrytis_signs', label: getTranslation('dashboard.checkIn.botrytis', lang) },
              { key: 'pest_signs', label: getTranslation('dashboard.checkIn.pests', lang) },
            ].map(item => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-gray-800">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.lastIrrigation', lang)}
          </label>
          <div className="space-y-2">
            {IRRIGATION_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="radio"
                  name="last_irrigation"
                  value={opt.value}
                  checked={formData.last_irrigation === opt.value}
                  onChange={(e) => setFormData({ ...formData, last_irrigation: e.target.value })}
                  className="mr-2"
                />
                <span className="text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.lastSpray', lang)}
          </label>
          <div className="space-y-2">
            {SPRAY_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="radio"
                  name="last_spray"
                  value={opt.value}
                  checked={formData.last_spray === opt.value}
                  onChange={(e) => setFormData({ ...formData, last_spray: e.target.value })}
                  className="mr-2"
                />
                <span className="text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {getTranslation('dashboard.checkIn.notes', lang)} ({getTranslation('common.optional', lang)})
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900"
            rows={3}
            placeholder={getTranslation('dashboard.checkIn.notesPlaceholder', lang)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {submitting ? getTranslation('common.loading', lang) : getTranslation('dashboard.checkIn.save', lang)}
        </button>
      </form>
    </div>
  );
}

