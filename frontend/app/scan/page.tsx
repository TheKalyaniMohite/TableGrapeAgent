'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
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
    
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
    }

    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [router]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        undefined,
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

  const getStageLabel = (stage: string) => {
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

  const getSeverityLabel = (severity: number) => {
    if (severity === 0) return 'None';
    if (severity === 1) return 'Low';
    if (severity === 2) return 'Medium';
    if (severity === 3) return 'High';
    return 'Unknown';
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return 'bg-red-100 text-red-800';
    if (severity === 2) return 'bg-yellow-100 text-yellow-800';
    if (severity === 1) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 sm:pb-8">
      <Nav lang={lang} />
      
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {getTranslation('scan.title', lang)}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500">AI-powered crop analysis</p>
            </div>
          </div>

          {/* Mobile: Stack cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
            {/* Upload Card */}
            <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-5">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Upload Image</h2>
                
              <div className="mb-3 sm:mb-4">
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">
                  {getTranslation('scan.upload', lang)}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={scanning}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-[11px] sm:text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {preview && (
                <div className="mb-3 sm:mb-4">
                  <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-40 sm:max-h-48 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="mb-3 sm:mb-4">
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">
                  {getTranslation('scan.notes', lang)}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={scanning}
                  placeholder={getTranslation('scan.notesPlaceholder', lang)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-[11px] sm:text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[50px] sm:min-h-[60px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={2}
                />
              </div>

              <button
                onClick={handleScan}
                disabled={!selectedFile || scanning}
                className="w-full bg-gray-900 text-white py-2 sm:py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {scanning ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {getTranslation('scan.scanning', lang)}
                  </span>
                ) : (
                  getTranslation('scan.scan', lang)
                )}
              </button>

              {error && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[10px] sm:text-xs">
                  {error}
                </div>
              )}
            </div>

            {/* Results Card */}
            <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-5">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Results</h2>
              
              {result ? (
                <div className="space-y-2 sm:space-y-4">
                  <div className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-[9px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">
                      {getTranslation('scan.stage', lang)}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{getStageLabel(result.stage)}</div>
                  </div>

                  {result.issues && result.issues.length > 0 && (
                    <div className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-1.5 sm:mb-2">
                        {getTranslation('scan.issues', lang)}
                      </h3>
                      <div className="space-y-1 sm:space-y-2">
                        {result.issues.map((issue, index) => (
                          <div key={index} className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-gray-700">{issue.name}</span>
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] ${getSeverityColor(issue.severity)}`}>
                              {getSeverityLabel(issue.severity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.summary && (
                    <div className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-1 sm:mb-2">
                        {getTranslation('scan.summary', lang)}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  {result.next_actions && result.next_actions.length > 0 && (
                    <div className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-1 sm:mb-2">
                        {getTranslation('scan.nextActions', lang)}
                      </h3>
                      <ul className="space-y-0.5 sm:space-y-1">
                        {result.next_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-700">
                            <span className="text-gray-400">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] sm:text-xs">Upload an image to see results</p>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
              <p className="text-[10px] sm:text-xs text-amber-800">
                {getTranslation('scan.disclaimer', lang)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
