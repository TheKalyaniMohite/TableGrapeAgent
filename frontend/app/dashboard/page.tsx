'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, TodayPlan, WeatherForecast, CropStatus, Insight, Farm, Block, WeeklyAdvice } from '@/app/lib/api';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LanguageToggle from '@/app/components/LanguageToggle';
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

  const fetchData = async (farmIdParam: string) => {
    try {
      setLoading(true);
      const [planData, farmData, statusData, blocksData] = await Promise.all([
        api.getTodayPlan(farmIdParam),
        api.getFarm(farmIdParam),
        api.getLatestStatus(farmIdParam).catch(() => null),
        api.getBlocks(farmIdParam).catch(() => []),
      ]);

      setPlan(planData);
      setLatestStatus(statusData);
      setFarm(farmData);
      setBlocks(blocksData);
      setLang(farmData.preferred_language as Language);

      // Fetch weather forecast
      const weatherData = await api.getWeatherForecast(farmData.lat, farmData.lon, 7);
      setForecast(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedFarmId = localStorage.getItem('farm_id');
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    
    if (!storedFarmId) {
      router.push('/onboarding/location');
      return;
    }

    setFarmId(storedFarmId);
    setLang(storedLang as Language);
    fetchData(storedFarmId);
    // Fetch AI advice after initial data load
    if (storedFarmId) {
      fetchAiAdvice(storedFarmId);
    }
  }, [router]);

  const handleCheckInSuccess = () => {
    if (farmId) {
      fetchData(farmId);
      // Refresh AI advice after check-in
      if (farmId) {
        fetchAiAdvice(farmId);
      }
    }
  };

  const fetchAiAdvice = async (farmIdParam: string) => {
    setAiLoading(true);
    setAiError(false);
    try {
      const advice = await api.getWeeklyAdvice(farmIdParam);
      setAiAdvice(advice);
    } catch (err) {
      setAiError(true);
      // Still show rule-based fallback
      setAiAdvice(null);
    } finally {
      setAiLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get location from farms_list or format from farm data
  const getLocationInfo = (): string => {
    if (!farmId) return '';
    
    const farmsList = getFarmsList();
    const farmItem = farmsList.find(f => f.id === farmId);
    
    if (farmItem && farmItem.label.includes('–')) {
      // Extract location from label format: "Farm Name – City, State, Country"
      const parts = farmItem.label.split('–');
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
    
    // Fallback: show coordinates if no location info
    if (farm) {
      return `${farm.lat.toFixed(4)}, ${farm.lon.toFixed(4)}`;
    }
    
    return '';
  };

  // Get main block or first block
  const getMainBlock = (): Block | null => {
    if (blocks.length === 0) return null;
    const mainBlock = blocks.find(b => b.name.toLowerCase().includes('main'));
    return mainBlock || blocks[0];
  };

  // Format date/time for last update
  const formatLastUpdate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = lang === 'hi' ? 'hi-IN' : 
                   lang === 'es' ? 'es-ES' : 
                   lang === 'mr' ? 'mr-IN' : 
                   'en-US';
    
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get stage label
  const getStageLabel = (stage: string): string => {
    const stageOptions = [
      { value: 'early_growth', label: 'Early growth' },
      { value: 'flowering', label: 'Flowering' },
      { value: 'fruit_set', label: 'Small grapes (fruit set)' },
      { value: 'veraison', label: 'Color change (veraison)' },
      { value: 'harvest', label: 'Harvest' },
    ];
    return stageOptions.find(o => o.value === stage)?.label || stage;
  };

  // Get issues list
  const getIssuesList = (status: CropStatus): string[] => {
    const issues: string[] = [];
    if (status.cracking) issues.push(getTranslation('dashboard.checkIn.cracking', lang));
    if (status.sunburn) issues.push(getTranslation('dashboard.checkIn.sunburn', lang));
    if (status.mildew_signs) issues.push(getTranslation('dashboard.checkIn.mildew', lang));
    if (status.botrytis_signs) issues.push(getTranslation('dashboard.checkIn.botrytis', lang));
    if (status.pest_signs) issues.push(getTranslation('dashboard.checkIn.pests', lang));
    return issues;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav lang={lang} />
        <div className="container mx-auto p-8 text-center">
          <p>{getTranslation('common.loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav lang={lang} />
        <div className="container mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav lang={lang} />
      <div className="container mx-auto p-8">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {getTranslation('dashboard.title', lang)}
          </h1>
          <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
        </div>

        {/* Farm Snapshot Card */}
        {farm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {getTranslation('dashboard.snapshot.title', lang)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.farm', lang)}: </span>
                  <span className="text-gray-800">{farm.name || 'My Farm'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.location', lang)}: </span>
                  <span className="text-gray-800">
                    {getLocationInfo() || getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.variety', lang)}: </span>
                  <span className="text-gray-800">
                    {getMainBlock()?.variety || getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.irrigation', lang)}: </span>
                  <span className="text-gray-800">
                    {getMainBlock()?.irrigation_type || getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.stage', lang)}: </span>
                  <span className="text-gray-800">
                    {latestStatus ? getStageLabel(latestStatus.stage) : getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.issues', lang)}: </span>
                  <span className="text-gray-800">
                    {latestStatus && getIssuesList(latestStatus).length > 0 
                      ? getIssuesList(latestStatus).join(', ')
                      : getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-800">{getTranslation('dashboard.snapshot.lastUpdate', lang)}: </span>
                  <span className="text-gray-800">
                    {latestStatus ? formatLastUpdate(latestStatus.recorded_at || latestStatus.created_at) : getTranslation('dashboard.snapshot.notAdded', lang)}
                  </span>
                </div>
                {(getLocationInfo() === '' || !getMainBlock()?.variety || !latestStatus) && (
                  <div className="flex gap-2 mt-4">
                    {(!getLocationInfo() || !getMainBlock()?.variety) && (
                      <button
                        onClick={() => router.push('/onboarding/details')}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        {getTranslation('dashboard.snapshot.updateDetails', lang)}
                      </button>
                    )}
                    {!latestStatus && (
                      <button
                        onClick={() => router.push('/onboarding/checkin')}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        {getTranslation('dashboard.snapshot.updateCheckin', lang)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Check-in Form */}
        {farmId && (
          <CheckInForm
            farmId={farmId}
            latestStatus={latestStatus}
            lang={lang}
            onSuccess={handleCheckInSuccess}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Plan */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {getTranslation('dashboard.todayPlan', lang)}
            </h2>
            
            {plan && plan.tasks.length > 0 ? (
              <div className="space-y-4">
                {plan.tasks.map((task, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${getPriorityColor(task.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-white/50 text-gray-900">
                        {getTranslation(`dashboard.${task.priority}`, lang)}
                      </span>
                    </div>
                    <p className="text-sm mb-2 text-gray-800">{task.reason}</p>
                    {task.block_id && (
                      <p className="text-xs text-gray-700">Block ID: {task.block_id}</p>
                    )}
                    {task.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {task.tags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-white/50 text-gray-900">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">{getTranslation('dashboard.noTasks', lang)}</p>
            )}

            {plan && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <p className="font-medium mb-1 text-gray-900">Signals Used:</p>
                <p className="text-gray-800">{plan.signals_used.weather_summary}</p>
                <p className="text-gray-800 mt-1">
                  Logs: {plan.signals_used.recent_logs_summary.scouting_count} scouting,{' '}
                  {plan.signals_used.recent_logs_summary.irrigation_count} irrigation,{' '}
                  {plan.signals_used.recent_logs_summary.brix_count} brix,{' '}
                  {plan.signals_used.recent_logs_summary.spray_count} spray
                </p>
                {plan.signals_used.latest_status_summary && (
                  <p className="text-gray-800 mt-1">
                    Status: {plan.signals_used.latest_status_summary.stage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Weather Forecast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {getTranslation('dashboard.weatherForecast', lang)}
            </h2>
            
            {forecast && forecast.days.length > 0 ? (
              <div className="space-y-3">
                {forecast.days.map((day, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString(
                          lang === 'hi' ? 'hi-IN' : 
                          lang === 'es' ? 'es-ES' : 
                          lang === 'mr' ? 'mr-IN' : 
                          'en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-700">Min:</span>{' '}
                        <span className="text-gray-800">{day.temp_min !== null ? `${day.temp_min.toFixed(1)}°C` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Max:</span>{' '}
                        <span className="text-gray-800">{day.temp_max !== null ? `${day.temp_max.toFixed(1)}°C` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Rain:</span>{' '}
                        <span className="text-gray-800">{day.precipitation_sum !== null ? `${day.precipitation_sum.toFixed(1)}mm` : '0mm'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No forecast data available</p>
            )}
          </div>
        </div>

        {/* AI Weekly Advisor */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {getTranslation('dashboard.aiAdvisor.title', lang)}
            </h2>
            <button
              onClick={() => farmId && fetchAiAdvice(farmId)}
              disabled={aiLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {aiAdvice ? getTranslation('dashboard.aiAdvisor.refresh', lang) : getTranslation('dashboard.aiAdvisor.generate', lang)}
            </button>
          </div>
          
          {aiLoading ? (
            <p className="text-gray-700">{getTranslation('dashboard.aiAdvisor.loading', lang)}</p>
          ) : aiError && !aiAdvice ? (
            <div>
              <p className="text-gray-700 mb-4">{getTranslation('dashboard.aiAdvisor.error', lang)}</p>
              {/* Show rule-based fallback */}
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">Basic guidance:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-800">
                  <li>Monitor your farm regularly</li>
                  <li>Do morning scouting for pests and diseases</li>
                  <li>Maintain consistent irrigation schedule</li>
                  <li>Record observations in the app</li>
                  <li>Consult local agriculture officer for specific issues</li>
                </ul>
              </div>
            </div>
          ) : aiAdvice ? (
            <div className="space-y-4">
              <p className="text-gray-800 leading-relaxed">{aiAdvice.summary}</p>
              <ul className="list-disc list-inside space-y-2">
                {aiAdvice.bullets.map((bullet, index) => (
                  <li key={index} className="text-gray-800">{bullet}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-700">{getTranslation('dashboard.aiAdvisor.error', lang)}</p>
          )}
        </div>

        {/* Next 7 Days Insights */}
        {plan && plan.next_7_days_insights && plan.next_7_days_insights.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {getTranslation('dashboard.next7Days', lang)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.next_7_days_insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg ${getRiskColor(insight.risk)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{insight.title}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1 rounded bg-white/50 text-gray-900">
                        {getTranslation(`dashboard.risk.${insight.risk}`, lang)}
                      </span>
                      <span className="text-xs text-gray-700">{insight.window}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-3 text-gray-800">{insight.summary}</p>
                  {insight.actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1 text-gray-900">{getTranslation('dashboard.actions', lang)}:</p>
                      <ul className="text-xs space-y-1">
                        {insight.actions.map((action, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span className="text-gray-800">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
