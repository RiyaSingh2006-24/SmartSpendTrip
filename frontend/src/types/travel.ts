export type BudgetCategory = "low" | "mid" | "luxury";

export interface TravelFormState {
  userName: string;
  userEmail: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  tripType: string;
  accommodationType: string;
  transportMode: string;
  pace: number;
  preferences: string[];
  foodPreferences: string[];
  notes: string;
}

export interface PlaceSummary {
  id?: string;
  fsqId?: string;
  name: string;
  address: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  popularity?: number | null;
  priceLevel?: number | null;
  categories?: string[];
  website?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageSource?: string;
  imageAttribution?: string;
}

export interface SearchHighlight {
  id: string;
  city: string;
  state: string;
  name: string;
  category: string;
  description: string;
  address: string;
  rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string;
  image_attribution?: string;
}

export interface WeatherSummary {
  headline: string;
  condition: string;
  description: string;
  temperatureC: number;
  forecastPreview: string[];
  score: number;
}

export interface RecommendedPlace {
  city: string;
  state: string;
  score: number;
  budget_fit_score?: number;
  rating_score?: number;
  price_level?: number;
  estimated_day_spend: number;
  weather?: WeatherSummary;
  reasons?: string[];
  why_it_fits_budget?: string;
  rating?: number;
  description?: string;
  image_url?: string;
  image_attribution?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  top_places: PlaceSummary[];
  hidden_gems?: PlaceSummary[];
}

export interface ItineraryActivity {
  time: string;
  name: string;
  type: string;
  description: string;
  estimated_cost: number;
  tips: string;
}

export interface ItineraryPlanItem {
  place: string;
  time: "Morning" | "Afternoon" | "Evening" | "Night" | string;
  note?: string;
}

export interface ItineraryDay {
  day?: number;
  day_number: number;
  theme: string;
  city: string;
  cost: number;
  plan?: ItineraryPlanItem[];
  activities: ItineraryActivity[];
}

export interface BudgetBreakdown {
  transport: number;
  stay: number;
  food: number;
  activities: number;
  contingency: number;
  daily_average: number;
  budget_category: BudgetCategory;
  currency?: string;
  total?: number;
}

export interface HiddenGem {
  name: string;
  city: string;
  why: string;
  estimated_cost: number;
}

export interface DestinationContext {
  name: string;
  fullName: string;
  latitude: number;
  longitude: number;
  featureType: string;
  country: string;
  countryCode: string;
  region: string;
  district: string;
  image_url?: string;
  image_attribution?: string;
}

export interface GenerateTripResponse {
  success: boolean;
  trip_id: number;
  user_id: number;
  destination_context: DestinationContext;
  recommended_places: RecommendedPlace[];
  itinerary: ItineraryDay[];
  budget_breakdown: BudgetBreakdown;
  hidden_gems: HiddenGem[];
  tips: string[];
  search_highlights: SearchHighlight[];
}

export interface PreviewResponse {
  success: boolean;
  destination_context: DestinationContext;
  budget_profile: {
    totalBudget: number;
    currency: string;
    travelers: number;
    tripDays: number;
    dailyPerPerson: number;
    budgetCategory: BudgetCategory;
  };
  budget_breakdown: BudgetBreakdown;
  recommended_places: RecommendedPlace[];
  search_highlights: SearchHighlight[];
}

export interface SearchResponse extends PreviewResponse {
  search_id: number | string;
  storage_mode: string;
}

export interface SearchHistoryItem {
  id: number | string;
  user_id: number | string;
  search_query: string;
  timestamp: string;
  location_data: {
    query?: Partial<TravelFormState> & {
      destination?: string;
      budget?: number;
      currency?: string;
      travelers?: number;
      countryCode?: string;
      tripType?: string;
      startDate?: string;
      endDate?: string;
      preferences?: string[];
    };
    preview?: PreviewResponse;
  };
}

export interface SearchHistoryResponse {
  success: boolean;
  storage_mode: string;
  history: SearchHistoryItem[];
}

export interface ClearSearchHistoryResponse {
  success: boolean;
  cleared: number;
  storage_mode: string;
}

export interface NearbyResponse {
  success: boolean;
  budget_category: BudgetCategory;
  weather: WeatherSummary;
  nearby: {
    attractions: PlaceSummary[];
    restaurants: PlaceSummary[];
  };
}

export interface ChatResponse {
  success: boolean;
  message_id: number;
  response: string;
}

export interface LocationSearchResult {
  name: string;
  lat: number;
  lon: number;
  display_name: string;
  country?: string;
  region?: string;
}

export interface LocationSearchResponse {
  success: boolean;
  location: LocationSearchResult;
}

export interface HealthServiceStatus {
  label: string;
  envVar: string;
  configured: boolean;
  ok?: boolean;
  fallback?: boolean;
  storageMode?: string;
  message?: string;
}

export interface ApiHealthResponse {
  success: boolean;
  service: string;
  timestamp: string;
  warnings: string[];
  services: {
    database: HealthServiceStatus;
    mongo?: HealthServiceStatus;
    openai: HealthServiceStatus;
    location: HealthServiceStatus;
    foursquare: HealthServiceStatus;
    openweather: HealthServiceStatus;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}
