import type {
  ApiHealthResponse,
  AuthResponse,
  ChatResponse,
  ClearSearchHistoryResponse,
  GenerateTripResponse,
  LocationSearchResponse,
  NearbyResponse,
  PreviewResponse,
  SearchHistoryResponse,
  SearchResponse,
  TravelFormState,
} from "@/types/travel";
import { authStorage } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") || contentType.includes("+json");
};

const getNonJsonErrorMessage = (response: Response) => {
  const contentType = response.headers.get("content-type") || "unknown content type";

  if (contentType.includes("text/html")) {
    return `The API request returned the frontend HTML page instead of JSON. Redeploy Vercel with the fixed /api route, or set VITE_API_BASE_URL to your Render API URL.`;
  }

  return `The API returned ${contentType} instead of JSON. Check VITE_API_BASE_URL and the backend deployment URL.`;
};

const getErrorMessage = async (response: Response) => {
  if (!isJsonResponse(response)) {
    return getNonJsonErrorMessage(response);
  }

  try {
    const payload = await response.json();
    return payload.message || "Request failed";
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const headers = new Headers(options?.headers);

  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = authStorage.getToken();
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (!isJsonResponse(response)) {
    throw new Error(getNonJsonErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

const buildSearchPayload = (form: TravelFormState) => ({
  user: {
    name: form.userName,
    email: form.userEmail,
  },
  destination: form.destination,
  countryCode: form.countryCode || undefined,
  budget: form.budget,
  currency: form.currency,
  travelers: form.travelers,
  startDate: form.startDate,
  endDate: form.endDate,
  tripType: form.tripType,
  preferences: form.preferences,
});

export const travelApi = {
  getHealth() {
    return request<ApiHealthResponse>("/health");
  },

  signup(payload: { name: string; email: string; password: string }) {
    return request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  me() {
    return request<{ success: boolean; user: AuthResponse["user"] }>("/auth/me");
  },

  forgotPassword(payload: { email: string }) {
    return request<{ success: boolean; message: string; resetToken?: string; resetUrl?: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  resetPassword(payload: { token: string; password: string }) {
    return request<AuthResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  searchLocation(city: string, countryCode?: string) {
    const query = new URLSearchParams({ city });
    if (countryCode) {
      query.set("countryCode", countryCode);
    }

    return request<LocationSearchResponse>(`/location/search?${query.toString()}`);
  },

  previewPlaces(params: Partial<TravelFormState>) {
    const query = new URLSearchParams({
      destination: params.destination || "",
      budget: String(params.budget || ""),
      currency: params.currency || "USD",
      travelers: String(params.travelers || 1),
      tripType: params.tripType || "Leisure",
      startDate: params.startDate || "",
      endDate: params.endDate || "",
      countryCode: params.countryCode || "",
      preferences: (params.preferences || []).join(","),
    });

    return request<PreviewResponse>(`/places?${query.toString()}`);
  },

  searchDestination(form: TravelFormState) {
    return request<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify(buildSearchPayload(form)),
    });
  },

  getSearchHistory(email: string, limit = 12) {
    const query = new URLSearchParams({ email, limit: String(limit) });
    return request<SearchHistoryResponse>(`/search/history?${query.toString()}`);
  },

  clearSearchHistory(email: string) {
    return request<ClearSearchHistoryResponse>("/search/history", {
      method: "DELETE",
      body: JSON.stringify({ email }),
    });
  },

  generateItinerary(form: TravelFormState) {
    return request<GenerateTripResponse>("/generate-itinerary", {
      method: "POST",
      body: JSON.stringify({
        user: {
          name: form.userName,
          email: form.userEmail,
        },
        destination: form.destination,
        countryCode: form.countryCode || undefined,
        budget: form.budget,
        currency: form.currency,
        travelers: form.travelers,
        startDate: form.startDate,
        endDate: form.endDate,
        tripType: form.tripType,
        accommodationType: form.accommodationType,
        transportMode: form.transportMode,
        pace: form.pace,
        preferences: form.preferences,
        foodPreferences: form.foodPreferences,
        notes: form.notes,
      }),
    });
  },

  sendChat(params: {
    userName: string;
    userEmail: string;
    tripId?: number;
    searchId?: number | string;
    destination?: string;
    budget?: number;
    currency?: string;
    message: string;
  }) {
    return request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({
        user: {
          name: params.userName,
          email: params.userEmail,
        },
        tripId: params.tripId,
        searchId: params.searchId,
        destination: params.destination,
        budget: params.budget,
        currency: params.currency,
        message: params.message,
      }),
    });
  },

  nearby(params: { latitude: number; longitude: number; budget: number; currency: string }) {
    const query = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      budget: String(params.budget),
      currency: params.currency,
    });

    return request<NearbyResponse>(`/nearby?${query.toString()}`);
  },
};
