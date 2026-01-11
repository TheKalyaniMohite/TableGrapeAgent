const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface Farm {
  id: string;
  name: string | null;
  lat: number;
  lon: number;
  country_code?: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  farm_id: string;
  name: string;
  variety?: string;
  planting_year?: number;
  soil_type?: string;
  irrigation_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  block_id?: string;
  tags: string[];
}

export interface Insight {
  title: string;
  summary: string;
  risk: 'high' | 'medium' | 'low';
  window: string;
  actions: string[];
}

export interface TodayPlan {
  date: string;
  tasks: Task[];
  next_7_days_insights?: Insight[];
  signals_used: {
    weather_summary: string;
    recent_logs_summary: {
      scouting_count: number;
      irrigation_count: number;
      brix_count: number;
      spray_count: number;
    };
    latest_status_summary?: {
      stage: string;
      recorded_at: string;
      has_issues: boolean;
    };
  };
}

export interface CropStatus {
  id: string;
  farm_id: string;
  block_id?: string;
  recorded_at: string;
  stage: string;
  sweetness_brix?: number;
  cracking: boolean;
  sunburn: boolean;
  mildew_signs: boolean;
  botrytis_signs: boolean;
  pest_signs: boolean;
  last_irrigation?: string;
  last_spray?: string;
  notes?: string;
  created_at: string;
}

export interface WeatherDay {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_sum: number | null;
}

export interface WeatherForecast {
  lat: number;
  lon: number;
  days: WeatherDay[];
}

export interface GeocodeResult {
  name: string;
  admin1: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}

export interface WeeklyAdvice {
  summary: string;
  bullets: string[];
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Farms
  createFarm: (data: {
    name: string | null;
    lat: number;
    lon: number;
    country_code?: string;
    preferred_language: string;
  }): Promise<Farm> => {
    return fetchAPI<Farm>('/api/farms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFarm: (farmId: string): Promise<Farm> => {
    return fetchAPI<Farm>(`/api/farms/${farmId}`);
  },

  // Blocks
  createBlock: (data: {
    farm_id: string;
    name: string;
    variety?: string;
    planting_year?: number;
    soil_type?: string;
    irrigation_type?: string;
  }): Promise<Block> => {
    return fetchAPI<Block>('/api/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBlocks: (farmId: string): Promise<Block[]> => {
    return fetchAPI<Block[]>(`/api/blocks?farm_id=${farmId}`);
  },

  // Plan
  getTodayPlan: (farmId: string): Promise<TodayPlan> => {
    return fetchAPI<TodayPlan>(`/api/plan/today?farm_id=${farmId}`);
  },

  // Weather
  getWeatherForecast: (lat: number, lon: number, days: number = 7): Promise<WeatherForecast> => {
    return fetchAPI<WeatherForecast>(`/api/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`);
  },

  // Geocoding
  geocode: (city: string, state?: string, country?: string, district?: string, count: number = 5): Promise<GeocodeResponse> => {
    const params = new URLSearchParams({ city, count: count.toString() });
    if (state) params.append('state', state);
    if (country) params.append('country', country);
    if (district) params.append('district', district);
    return fetchAPI<GeocodeResponse>(`/api/geocode?${params.toString()}`);
  },

  // Crop Status
  createCropStatus: (data: {
    farm_id: string;
    block_id?: string;
    recorded_at?: string;
    stage: string;
    sweetness_brix?: number;
    cracking?: boolean;
    sunburn?: boolean;
    mildew_signs?: boolean;
    botrytis_signs?: boolean;
    pest_signs?: boolean;
    last_irrigation?: string;
    last_spray?: string;
    notes?: string;
  }): Promise<CropStatus> => {
    return fetchAPI<CropStatus>('/api/status', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLatestStatus: (farmId: string, blockId?: string): Promise<CropStatus | null> => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (blockId) params.append('block_id', blockId);
    return fetchAPI<CropStatus | null>(`/api/status/latest?${params.toString()}`);
  },

  // AI Advice
  getWeeklyAdvice: (farmId: string): Promise<WeeklyAdvice> => {
    return fetchAPI<WeeklyAdvice>(`/api/ai/weekly-advice?farm_id=${farmId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
  },

  // Scan
  scanImage: async (
    farmId: string,
    file: File,
    blockId?: string,
    notes?: string,
    lang?: string
  ): Promise<{
    photo_path: string;
    stage: string;
    issues: Array<{ name: string; severity: number; confidence: number }>;
    summary: string;
    next_actions: string[];
  }> => {
    const formData = new FormData();
    formData.append('farm_id', farmId);
    formData.append('file', file);
    if (blockId) formData.append('block_id', blockId);
    if (notes) formData.append('notes', notes);
    if (lang) formData.append('lang', lang);

    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Chat
  getChatHistory: (farmId: string, limit: number = 30): Promise<Array<{
    id: string;
    farm_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>> => {
    return fetchAPI<Array<{
      id: string;
      farm_id: string;
      role: 'user' | 'assistant';
      content: string;
      created_at: string;
    }>>(`/api/chat/history?farm_id=${farmId}&limit=${limit}`);
  },

  sendChatMessage: async (
    farmId: string,
    message: string,
    lang?: string
  ): Promise<{ reply: string }> => {
    return fetchAPI<{ reply: string }>('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farm_id: farmId,
        message,
        lang,
      }),
    });
  },

  clearChatHistory: async (farmId: string): Promise<{ ok: boolean; deleted: number }> => {
    return fetchAPI<{ ok: boolean; deleted: number }>(`/api/chat/history?farm_id=${farmId}`, {
      method: 'DELETE',
    });
  },
};

