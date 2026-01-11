'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LanguageToggle from '@/app/components/LanguageToggle';
import { api } from '@/app/lib/api';

interface ScanResult {
  photo_path: string;
  stage: string;
  issues: Array<{ name: string; severity: number; confidence: number }>;
  summary: string;
  next_actions: string[];
}

export default function ScanPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    setLang(storedLang as Language);
    
    // Check if farm_id exists
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const scanResult = await api.scanImage(
        farmId,
        selectedFile,
        undefined, // block_id
        notes || undefined,
        lang
      );
      setResult(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan image');
    } finally {
      setScanning(false);
    }
  };

  const getStageLabel = (stage: string): string => {
    const stageMap: Record<string, string> = {
      'early_growth': 'Early growth',
      'flowering': 'Flowering',
      'fruit_set': 'Small grapes (fruit set)',
      'veraison': 'Color change (veraison)',
      'harvest': 'Harvest',
      'unknown': 'Unknown'
    };
    return stageMap[stage] || stage;
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity === 0) return 'None';
    if (severity === 1) return 'Low';
    if (severity === 2) return 'Medium';
    if (severity === 3) return 'High';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav lang={lang} />
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {getTranslation('scan.title', lang)}
            </h1>
            <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-2">
                {getTranslation('scan.upload', lang)}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={scanning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            {preview && (
              <div className="mt-4 mb-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-2">
                {getTranslation('scan.notes', lang)}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={scanning}
                placeholder={getTranslation('scan.notesPlaceholder', lang)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900 disabled:bg-gray-100"
                rows={3}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={!selectedFile || scanning}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
            >
              {scanning ? getTranslation('scan.scanning', lang) : getTranslation('scan.scan', lang)}
            </button>

            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                {getTranslation('scan.title', lang)} {lang === 'en' ? 'Results' : lang === 'hi' ? 'परिणाम' : lang === 'es' ? 'Resultados' : 'निकाल'}
              </h2>

              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('scan.stage', lang)}: </span>
                  <span className="text-gray-800">{getStageLabel(result.stage)}</span>
                </div>

                {result.issues && result.issues.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">{getTranslation('scan.issues', lang)}:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.issues.map((issue, index) => (
                        <li key={index} className="text-gray-800">
                          {issue.name} - {getTranslation('scan.severity', lang)}: {getSeverityLabel(issue.severity)} 
                          {issue.confidence && ` (${getTranslation('scan.confidence', lang)}: ${Math.round(issue.confidence * 100)}%)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.summary && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">{getTranslation('scan.summary', lang)}:</h3>
                    <p className="text-gray-800">{result.summary}</p>
                  </div>
                )}

                {result.next_actions && result.next_actions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">{getTranslation('scan.nextActions', lang)}:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.next_actions.map((action, index) => (
                        <li key={index} className="text-gray-800">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-gray-800 italic">
                  {getTranslation('scan.disclaimer', lang)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

