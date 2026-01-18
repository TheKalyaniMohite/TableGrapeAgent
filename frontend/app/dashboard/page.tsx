'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, TodayPlan, WeatherForecast, CropStatus, Farm, Block, WeeklyAdvice } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import CheckInForm from '@/app/components/CheckInForm';
import { getFarmsList } from '@/app/lib/farmStorage';

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [latestStatus, setLatestStatus] = useState<CropStatus | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [aiAdvice, setAiAdvice] = useState<WeeklyAdvice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    const storedFarmId = localStorage.getItem('farm_id');
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    
    if (!storedFarmId) {
      router.push('/onboarding/location');
      return;
    }

    setFarmId(storedFarmId);
    setLang(storedLang as Language);

    const loadData = async () => {
      try {
        setLoading(true);
        const [planData, farmData, statusData, blocksData] = await Promise.all([
          api.getTodayPlan(storedFarmId),
          api.getFarm(storedFarmId),
          api.getLatestStatus(storedFarmId).catch(() => null),
          api.getBlocks(storedFarmId).catch(() => []),
        ]);

        setPlan(planData);
        setLatestStatus(statusData);
        setFarm(farmData);
        setBlocks(blocksData);
        setLang(farmData.preferred_language as Language);

        const weatherData = await api.getWeatherForecast(farmData.lat, farmData.lon, 7);
        setForecast(weatherData);

        try {
          const advice = await api.getWeeklyAdvice(storedFarmId);
          setAiAdvice(advice);
        } catch {
          setAiError(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [router]);

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false);
    window.location.reload();
  };

  const refreshAiAdvice = async () => {
    if (!farmId) return;
    setAiLoading(true);
    setAiError(false);
    try {
      const advice = await api.getWeeklyAdvice(farmId);
      setAiAdvice(advice);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getMainBlock = () => {
    if (blocks.length === 0) return null;
    return blocks.find(b => b.name.toLowerCase().includes('main')) || blocks[0];
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      'early_growth': 'Early growth',
      'flowering': 'Flowering',
      'fruit_set': 'Fruit set',
      'veraison': 'Veraison',
      'harvest': 'Harvest',
    };
    return stageMap[stage] || stage;
  };

  const getIssueCount = () => {
    if (!latestStatus) return 0;
    let count = 0;
    if (latestStatus.cracking) count++;
    if (latestStatus.sunburn) count++;
    if (latestStatus.mildew_signs) count++;
    if (latestStatus.botrytis_signs) count++;
    if (latestStatus.pest_signs) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Nav lang={lang} />
        <div className="container mx-auto p-4 sm:p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">{getTranslation('common.loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Nav lang={lang} />
        <div className="container mx-auto p-4 sm:p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 sm:pb-8">
      <Nav lang={lang} />
      
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {getTranslation('dashboard.title', lang)}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Your farm at a glance</p>
          </div>
        </div>

        {/* Horizontal Status Bar - Farm Info + Check-in */}
        <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
          {/* Mobile: 2x2 grid + button below */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-gray-500 uppercase">Farm</div>
                  <div className="text-[11px] font-semibold text-gray-900 truncate">{farm?.name || 'My Farm'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-gray-500 uppercase">Stage</div>
                  <div className="text-[11px] font-semibold text-gray-900 truncate">{latestStatus ? getStageLabel(latestStatus.stage) : 'Not set'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-gray-500 uppercase">Variety</div>
                  <div className="text-[11px] font-semibold text-gray-900 truncate">{getMainBlock()?.variety || 'Not set'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${getIssueCount() > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <svg className={`w-3.5 h-3.5 ${getIssueCount() > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getIssueCount() > 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-gray-500 uppercase">Issues</div>
                  <div className={`text-[11px] font-semibold truncate ${getIssueCount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {getIssueCount() > 0 ? `${getIssueCount()} detected` : 'None'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {latestStatus ? 'Update Check-in' : 'Quick Check-in'}
            </button>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-4">
            {/* Farm Stats */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Farm</div>
                  <div className="text-xs font-semibold text-gray-900">{farm?.name || 'My Farm'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Stage</div>
                  <div className="text-xs font-semibold text-gray-900">{latestStatus ? getStageLabel(latestStatus.stage) : 'Not set'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Variety</div>
                  <div className="text-xs font-semibold text-gray-900">{getMainBlock()?.variety || 'Not set'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIssueCount() > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <svg className={`w-4 h-4 ${getIssueCount() > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getIssueCount() > 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Issues</div>
                  <div className={`text-xs font-semibold ${getIssueCount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {getIssueCount() > 0 ? `${getIssueCount()} detected` : 'None'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Check-in Button */}
            <button
              onClick={() => setShowCheckInModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {latestStatus ? 'Update Check-in' : 'Quick Check-in'}
            </button>
          </div>
        </div>

        {/* Main 3-Column Grid - Stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Column 1: Today's Tasks */}
          <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {getTranslation('dashboard.todayPlan', lang)}
            </h2>
            {plan && plan.tasks.length > 0 ? (
              <div className="space-y-2">
                {plan.tasks.map((task, index) => (
                  <div key={index} className="p-2 sm:p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-[11px] sm:text-xs font-medium text-gray-900 line-clamp-1">{task.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-600 line-clamp-2">{task.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-gray-500 py-4 text-center">{getTranslation('dashboard.noTasks', lang)}</p>
            )}
          </div>

          {/* Column 2: Weather */}
          <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              {getTranslation('dashboard.weatherForecast', lang)}
            </h2>
            {forecast && forecast.days.length > 0 ? (
              <div className="space-y-1 sm:space-y-1.5">
                {forecast.days.slice(0, 7).map((day, index) => (
                  <div key={index} className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs ${index === 0 ? 'bg-sky-50 border border-sky-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      {index === 0 && <span className="text-[8px] sm:text-[10px] bg-sky-500 text-white px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">Today</span>}
                      <span className={`font-medium truncate ${index === 0 ? 'text-sky-900' : 'text-gray-900'}`}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600 flex-shrink-0">
                      <span className="font-medium">{day.temp_min?.toFixed(0)}°-{day.temp_max?.toFixed(0)}°</span>
                      <span className={`${(day.precipitation_sum || 0) > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {day.precipitation_sum?.toFixed(1) || 0}mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-gray-500 py-4 text-center">No forecast available</p>
            )}
          </div>

          {/* Column 3: AI Advisor */}
          <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {getTranslation('dashboard.aiAdvisor.title', lang)}
              </h2>
              <button
                onClick={refreshAiAdvice}
                disabled={aiLoading}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${aiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {aiAdvice ? (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed">{aiAdvice.summary}</p>
                <ul className="space-y-1.5 sm:space-y-2">
                  {aiAdvice.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1 sm:mt-1.5 flex-shrink-0"></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : aiError ? (
              <div className="text-center py-3 sm:py-4">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-2">{getTranslation('dashboard.aiAdvisor.error', lang)}</p>
                <button
                  onClick={refreshAiAdvice}
                  className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="text-center py-3 sm:py-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">AI recommendations loading...</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights Row */}
        {plan && plan.next_7_days_insights && plan.next_7_days_insights.length > 0 && (
          <div className="mt-3 sm:mt-4 bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {getTranslation('dashboard.next7Days', lang)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {plan.next_7_days_insights.map((insight, index) => (
                <div key={index} className={`p-2 sm:p-3 rounded-lg border ${
                  insight.risk === 'high' ? 'bg-red-50 border-red-200' :
                  insight.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 line-clamp-1">{insight.title}</h3>
                    <span className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 ${
                      insight.risk === 'high' ? 'bg-red-200 text-red-800' :
                      insight.risk === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {insight.risk}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[11px] text-gray-600 line-clamp-2 mb-1 sm:mb-2">{insight.summary}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500">{insight.window}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && farmId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Farm Check-in</h2>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0">
              <CheckInForm
                farmId={farmId}
                latestStatus={latestStatus}
                lang={lang}
                onSuccess={handleCheckInSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
