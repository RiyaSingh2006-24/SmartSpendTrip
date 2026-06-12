import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  ImageIcon,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { travelApi } from "@/lib/api";
import type {
  ApiHealthResponse,
  GenerateTripResponse,
  ItineraryPlanItem,
  LocationSearchResult,
  NearbyResponse,
  PreviewResponse,
  SearchHighlight,
  SearchHistoryItem,
  SearchResponse,
  TravelFormState,
} from "@/types/travel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationMap, { type LocationMapMarker } from "@/components/LocationMap";

const tripTypes = ["Leisure", "Adventure", "Romantic", "Cultural", "Workation"];
const stays = ["Hotel", "Hostel", "Boutique Stay", "Resort", "Homestay"];
const transportModes = ["Public Transit", "Train", "Car Rental", "Taxi", "Walking"];
const goals = ["Adventure", "Culture", "Hidden Gems", "Luxury", "Wellness", "Photography"];
const foods = ["Street Food", "Local Cuisine", "Vegetarian", "Fine Dining", "Vegan", "Seafood"];
const currencies = ["INR", "USD", "EUR", "GBP"];
const countries = [
  { label: "Auto", value: "" },
  { label: "India", value: "IN" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "France", value: "FR" },
  { label: "Italy", value: "IT" },
  { label: "Thailand", value: "TH" },
];

const PROFILE_STORAGE_KEY = "smartspend.trip.profile";
const LOCATION_LOOKUP_DEBOUNCE_MS = 500;
const HEALTH_RETRY_INTERVAL_MS = 10000;
const PLAN_SLOT_ORDER = {
  Morning: 0,
  Afternoon: 1,
  Evening: 2,
  Night: 3,
} as const;

type SearchPreviewState = SearchResponse | PreviewResponse;

type SearchFingerprintShape = {
  destination?: string;
  budget?: number;
  currency?: string;
  travelers?: number;
  tripType?: string;
  countryCode?: string;
  startDate?: string;
  endDate?: string;
  preferences?: string[];
  userEmail?: string;
};

const plusDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const badgeTone = {
  low: "bg-secondary text-secondary-foreground",
  mid: "bg-accent text-accent-foreground",
  luxury: "bg-primary text-primary-foreground",
} as const;

const selectClassName =
  "h-12 w-full rounded-2xl border border-input bg-card px-4 text-[15px] leading-6 text-foreground shadow-sm transition-[border-color,box-shadow,background-color] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const chipClassName = (active: boolean, tone: "primary" | "secondary" = "primary") =>
  [
    "rounded-full border px-4 py-2.5 text-sm transition-all",
    active
      ? tone === "primary"
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-secondary bg-secondary text-secondary-foreground shadow-sm"
      : "border-border bg-card text-foreground hover:border-foreground/15 hover:bg-muted/70",
  ].join(" ");

const formatServiceList = (
  services: ApiHealthResponse["services"][keyof ApiHealthResponse["services"]][],
) => services.map((service) => service.envVar).join(", ");

const isServiceReady = (
  service?: ApiHealthResponse["services"][keyof ApiHealthResponse["services"]],
) => Boolean(service?.fallback || (service?.configured && (service.ok ?? true)));

const mapHref = (lat?: number | null, lng?: number | null, name?: string) =>
  lat && lng
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name || "")}`;

const sortPlanItems = (items: ItineraryPlanItem[]) =>
  [...items].sort(
    (left, right) =>
      (PLAN_SLOT_ORDER[left.time as keyof typeof PLAN_SLOT_ORDER] ?? Number.MAX_SAFE_INTEGER) -
      (PLAN_SLOT_ORDER[right.time as keyof typeof PLAN_SLOT_ORDER] ?? Number.MAX_SAFE_INTEGER),
  );

const getTripDayCount = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
};

type SearchDaySuggestion = {
  dayNumber: number;
  attractions: SearchHighlight[];
};

const buildSearchDaySuggestions = (
  highlights: SearchHighlight[],
  tripDays: number,
): SearchDaySuggestion[] => {
  const safeTripDays = Math.max(1, tripDays || 1);
  const days = Array.from({ length: safeTripDays }, (_, index) => ({
    dayNumber: index + 1,
    attractions: [] as SearchHighlight[],
  }));

  if (!highlights.length) {
    return days;
  }

  const stopsPerDay = Math.max(1, Math.ceil(highlights.length / safeTripDays));

  highlights.forEach((highlight, index) => {
    const dayIndex = Math.min(safeTripDays - 1, Math.floor(index / stopsPerDay));
    days[dayIndex].attractions.push(highlight);
  });

  return days;
};

const buildSearchFingerprint = (value: SearchFingerprintShape) =>
  JSON.stringify({
    destination: String(value.destination || "").trim().toLowerCase(),
    budget: Number(value.budget || 0),
    currency: value.currency || "",
    travelers: Number(value.travelers || 0),
    tripType: value.tripType || "",
    countryCode: value.countryCode || "",
    startDate: value.startDate || "",
    endDate: value.endDate || "",
    preferences: [...(value.preferences || [])].sort(),
    userEmail: String(value.userEmail || "").trim().toLowerCase(),
  });

const initialForm: TravelFormState = {
  userName: "",
  userEmail: "",
  destination: "",
  countryCode: "IN",
  startDate: plusDays(14),
  endDate: plusDays(17),
  travelers: 2,
  budget: 10000,
  currency: "INR",
  tripType: "Leisure",
  accommodationType: "Hotel",
  transportMode: "Public Transit",
  pace: 55,
  preferences: ["Culture", "Hidden Gems"],
  foodPreferences: ["Local Cuisine", "Street Food"],
  notes: "",
};

const EmptyVisual = ({ label }: { label: string }) => (
  <div className="flex h-full min-h-[14rem] items-center justify-center bg-gradient-to-br from-primary/12 via-card to-secondary/12 text-center text-sm text-muted-foreground">
    <div className="space-y-2 px-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background/80 shadow-sm">
        <ImageIcon className="h-5 w-5 text-primary" />
      </div>
      <p>{label}</p>
    </div>
  </div>
);

const PlannerImage = ({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackLabel,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel: string;
}) => {
  if (!src) {
    return <EmptyVisual label={fallbackLabel} />;
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

const TripPlanner = () => {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState<SearchPreviewState | null>(null);
  const [result, setResult] = useState<GenerateTripResponse | null>(null);
  const [nearby, setNearby] = useState<NearbyResponse | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<LocationSearchResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [activeSearchId, setActiveSearchId] = useState<number | string | null>(null);
  const [searchFingerprint, setSearchFingerprint] = useState("");
  const [chat, setChat] = useState<{ role: "assistant" | "user"; text: string }[]>([
    {
      role: "assistant",
      text: "Save a destination search or generate a trip and I'll answer with budget-aware travel guidance.",
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const { user: authUser } = useAuth();

  const update = useCallback(<K extends keyof TravelFormState>(key: K, value: TravelFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const toggle = useCallback((key: "preferences" | "foodPreferences", value: string) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }, []);

  const currentFingerprint = useMemo(
    () =>
      buildSearchFingerprint({
        destination: form.destination,
        budget: form.budget,
        currency: form.currency,
        travelers: form.travelers,
        tripType: form.tripType,
        countryCode: form.countryCode,
        startDate: form.startDate,
        endDate: form.endDate,
        preferences: form.preferences,
        userEmail: form.userEmail,
      }),
    [form],
  );

  const searchNeedsRefresh = Boolean(preview) && searchFingerprint !== currentFingerprint;

  const loadSearchHistory = useCallback(
    async (email: string, options?: { suppressLoading?: boolean }) => {
      const normalizedEmail = email.trim();
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setSearchHistory([]);
        return;
      }

      if (!options?.suppressLoading) {
        setHistoryLoading(true);
      }

      try {
        const data = await travelApi.getSearchHistory(normalizedEmail);
        setSearchHistory(data.history);
        setError("");
      } catch (err) {
        setSearchHistory([]);
        if (!options?.suppressLoading) {
          toast.error(err instanceof Error ? err.message : "Unable to load search history.");
        }
      } finally {
        if (!options?.suppressLoading) {
          setHistoryLoading(false);
        }
      }
    },
    [],
  );

  const loadHealth = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background && isMountedRef.current) {
      setHealthLoading(true);
    }

    try {
      const data = await travelApi.getHealth();
      if (!isMountedRef.current) {
        return;
      }

      setHealth(data);
      setHealthError("");
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      setHealth(null);
      setHealthError(err instanceof Error ? err.message : "Unable to reach the API.");
    } finally {
      if (!options?.background && isMountedRef.current) {
        setHealthLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw) as Partial<TravelFormState>;
      setForm((current) => ({
        ...current,
        userName: saved.userName || current.userName,
        userEmail: saved.userEmail || current.userEmail,
      }));
    } catch {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    setForm((current) => ({
      ...current,
      userName: authUser.name || current.userName,
      userEmail: authUser.email || current.userEmail,
    }));
  }, [authUser]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ userName: form.userName, userEmail: form.userEmail }),
    );
  }, [form.userName, form.userEmail]);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    const handleFocus = () => {
      void loadHealth({ background: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadHealth]);

  useEffect(() => {
    if (!healthError) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadHealth({ background: true });
    }, HEALTH_RETRY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [healthError, loadHealth]);

  useEffect(() => {
    if (!form.userEmail.trim()) {
      setSearchHistory([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      loadSearchHistory(form.userEmail, { suppressLoading: false });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [form.userEmail, loadSearchHistory]);

  useEffect(() => {
    const trimmedDestination = form.destination.trim();
    if (trimmedDestination.length < 2) {
      setSearchedLocation(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const data = await travelApi.searchLocation(trimmedDestination, form.countryCode || undefined);
        if (!cancelled) {
          setSearchedLocation(data.location);
        }
      } catch {
        if (!cancelled) {
          setSearchedLocation(null);
        }
      }
    }, LOCATION_LOOKUP_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form.destination, form.countryCode]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat]);

  const searchServices = health ? [health.services.database, health.services.foursquare, health.services.openweather] : [];
  const planServices = health
    ? [health.services.database, health.services.openai, health.services.foursquare, health.services.openweather]
    : [];
  const nearbyServices = health ? [health.services.foursquare, health.services.openweather] : [];
  const chatServices = health ? [health.services.database, health.services.openai] : [];

  const searchBlockedMessage =
    health && searchServices.some((service) => !isServiceReady(service))
      ? `Destination search needs ${formatServiceList(searchServices.filter((service) => !isServiceReady(service)))} configured in backend/.env.`
      : "";
  const planBlockedMessage =
    health && planServices.some((service) => !isServiceReady(service))
      ? `Trip generation needs ${formatServiceList(planServices.filter((service) => !isServiceReady(service)))} configured in backend/.env.`
      : "";
  const nearbyBlockedMessage =
    health && nearbyServices.some((service) => !isServiceReady(service))
      ? `Nearby results need ${formatServiceList(nearbyServices.filter((service) => !isServiceReady(service)))} configured in backend/.env.`
      : "";
  const chatBlockedMessage =
    health && chatServices.some((service) => !isServiceReady(service))
      ? `Trip chat needs ${formatServiceList(chatServices.filter((service) => !isServiceReady(service)))} configured in backend/.env.`
      : "";
  const executeSearch = useCallback(
    async (options?: { suppressToast?: boolean; resetTrip?: boolean }) => {
      if (searchBlockedMessage) {
        setSearchError(searchBlockedMessage);
        return null;
      }

      if (!form.userName.trim() || !form.userEmail.trim()) {
        setSearchError("Name and email are required to save search history and sync planner context.");
        return null;
      }

      if (!form.destination.trim()) {
        setSearchError("Enter a destination to search.");
        return null;
      }

      setSearchLoading(true);
      setSearchError("");
      setError("");

      try {
        const data = await travelApi.searchDestination(form);
        setPreview(data);
        setActiveSearchId(data.search_id);
        setSearchFingerprint(currentFingerprint);
        if (options?.resetTrip ?? true) {
          setResult(null);
        }
        await loadSearchHistory(form.userEmail, { suppressLoading: true });
        setChat((current) =>
          current.length === 1 && current[0]?.role === "assistant"
            ? [
                {
                  role: "assistant",
                  text: `Search saved for ${data.destination_context.fullName}. Ask me about the budget, weather, or best attractions before you generate the itinerary.`,
                },
              ]
            : current,
        );
        if (!options?.suppressToast) {
          toast.success("Search saved to history.");
        }
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed.";
        setSearchError(message);
        if (!options?.suppressToast) {
          toast.error(message);
        }
        return null;
      } finally {
        setSearchLoading(false);
      }
    },
    [currentFingerprint, form, loadSearchHistory, searchBlockedMessage],
  );

  const handleGenerate = useCallback(async () => {
    setError("");
    if (planBlockedMessage) {
      setError(planBlockedMessage);
      return;
    }
    if (!form.userName.trim() || !form.userEmail.trim()) {
      setError("Name and email are required so trips, chat, and search history can be saved.");
      return;
    }

    let ensuredSearchId = activeSearchId;
    if (!preview || searchNeedsRefresh || !activeSearchId) {
      const searchData = await executeSearch({ suppressToast: true, resetTrip: false });
      if (!searchData) {
        return;
      }
      ensuredSearchId = searchData.search_id;
    }

    setGenerating(true);
    try {
      const data = await travelApi.generateItinerary(form);
      setResult(data);
      if (ensuredSearchId) {
        setActiveSearchId(ensuredSearchId);
      }
      setChat([
        {
          role: "assistant",
          text: `Trip ready for ${data.destination_context.fullName}. Ask me for a cheaper version, a family-friendly adjustment, or a tighter 3-day cut of this plan.`,
        },
      ]);
      toast.success("Trip generated and stored.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }, [activeSearchId, executeSearch, form, planBlockedMessage, preview, searchNeedsRefresh]);

  const handleNearby = useCallback(async () => {
    if (nearbyBlockedMessage) {
      setError(nearbyBlockedMessage);
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setNearbyLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setCurrentLocation({
          name: "Current location",
          lat: coords.latitude,
          lon: coords.longitude,
          display_name: "Detected from your browser",
        });
        try {
          const data = await travelApi.nearby({
            latitude: coords.latitude,
            longitude: coords.longitude,
            budget: form.budget,
            currency: form.currency,
          });
          setNearby(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nearby lookup failed.");
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyLoading(false);
        setError("Location access was denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [form.budget, form.currency, nearbyBlockedMessage]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim()) {
      return;
    }
    if (chatBlockedMessage) {
      setChat((current) => [...current, { role: "assistant", text: chatBlockedMessage }]);
      return;
    }
    if (!form.userName.trim() || !form.userEmail.trim()) {
      setChat((current) => [
        ...current,
        {
          role: "assistant",
          text: "Add your name and email first so I can keep your travel context and message history linked.",
        },
      ]);
      return;
    }

    const message = chatInput.trim();
    setChatInput("");
    setChat((current) => [...current, { role: "user", text: message }]);
    setChatLoading(true);

    try {
      const data = await travelApi.sendChat({
        userName: form.userName,
        userEmail: form.userEmail,
        tripId: result?.trip_id,
        searchId: activeSearchId || undefined,
        destination: form.destination,
        budget: form.budget,
        currency: form.currency,
        message,
      });
      setChat((current) => [...current, { role: "assistant", text: data.response }]);
    } catch (err) {
      setChat((current) => [
        ...current,
        { role: "assistant", text: err instanceof Error ? err.message : "Chat failed." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [activeSearchId, chatBlockedMessage, chatInput, form, result?.trip_id]);

  const handleHistorySelect = useCallback(
    (item: SearchHistoryItem) => {
      const query = item.location_data.query || {};
      const previewPayload = item.location_data.preview;
      setError("");
      setSearchError("");

      setForm((current) => ({
        ...current,
        destination: query.destination || item.search_query,
        countryCode: query.countryCode || current.countryCode,
        budget: Number(query.budget || current.budget),
        currency: query.currency || current.currency,
        travelers: Number(query.travelers || current.travelers),
        startDate: query.startDate || current.startDate,
        endDate: query.endDate || current.endDate,
        tripType: query.tripType || current.tripType,
        preferences:
          Array.isArray(query.preferences) && query.preferences.length
            ? query.preferences
            : current.preferences,
      }));

      if (previewPayload) {
        setPreview({ ...previewPayload, success: true });
      }
      setResult(null);
      setActiveSearchId(item.id);
      setSearchFingerprint(
        buildSearchFingerprint({
          destination: query.destination || item.search_query,
          budget: Number(query.budget || form.budget),
          currency: query.currency || form.currency,
          travelers: Number(query.travelers || form.travelers),
          tripType: query.tripType || form.tripType,
          countryCode: query.countryCode || form.countryCode,
          startDate: query.startDate || form.startDate,
          endDate: query.endDate || form.endDate,
          preferences: Array.isArray(query.preferences) ? query.preferences : form.preferences,
          userEmail: form.userEmail,
        }),
      );
      toast.success(`${item.search_query} loaded from search history.`);
    },
    [form],
  );

  const handleClearHistory = useCallback(async () => {
    if (!form.userEmail.trim()) {
      toast.error("Enter your email to clear the correct search history.");
      return;
    }

    setHistoryLoading(true);
    try {
      await travelApi.clearSearchHistory(form.userEmail);
      setSearchHistory([]);
      setActiveSearchId(null);
      setError("");
      setSearchError("");
      toast.success("Search history cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to clear history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [form.userEmail]);

  const breakdown = result?.budget_breakdown || preview?.budget_breakdown;
  const recommendations = useMemo(
    () => result?.recommended_places || preview?.recommended_places || [],
    [preview, result],
  );
  const searchHighlights = useMemo(
    () => result?.search_highlights || preview?.search_highlights || [],
    [preview, result],
  );
  const tripDayCount =
    preview?.budget_profile.tripDays ||
    result?.itinerary.length ||
    getTripDayCount(form.startDate, form.endDate);
  const searchDaySuggestions = useMemo(
    () => buildSearchDaySuggestions(searchHighlights, tripDayCount),
    [searchHighlights, tripDayCount],
  );
  const attractionDayLookup = useMemo(
    () =>
      new Map(
        searchDaySuggestions.flatMap((day) =>
          day.attractions.map((item) => [item.id, day.dayNumber] as const),
        ),
      ),
    [searchDaySuggestions],
  );
  const destinationContext = result?.destination_context || preview?.destination_context;
  const budgetCategory =
    preview?.budget_profile.budgetCategory || result?.budget_breakdown.budget_category;

  const mapMarkers = useMemo(() => {
    const markers: LocationMapMarker[] = [];

    if (searchedLocation) {
      markers.push({
        lat: searchedLocation.lat,
        lon: searchedLocation.lon,
        title: searchedLocation.name,
        description: searchedLocation.display_name,
        kind: "destination",
      });
    }

    if (currentLocation) {
      markers.push({
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        title: currentLocation.name,
        description: currentLocation.display_name,
        kind: "current",
      });
    }

    recommendations
      .filter((place) => place.coordinates?.latitude && place.coordinates?.longitude)
      .slice(0, 4)
      .forEach((place) => {
        markers.push({
          lat: place.coordinates!.latitude,
          lon: place.coordinates!.longitude,
          title: place.city,
          description: place.state,
          kind: "place",
        });
      });

    searchHighlights
      .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
      .slice(0, 4)
      .forEach((item) => {
        markers.push({
          lat: item.latitude as number,
          lon: item.longitude as number,
          title: item.name,
          description: item.city,
          kind: "place",
        });
      });

    nearby?.nearby.attractions.slice(0, 2).forEach((place) => {
      if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
        markers.push({
          lat: place.latitude as number,
          lon: place.longitude as number,
          title: place.name,
          description: place.address,
          kind: "place",
        });
      }
    });

    nearby?.nearby.restaurants.slice(0, 2).forEach((place) => {
      if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
        markers.push({
          lat: place.latitude as number,
          lon: place.longitude as number,
          title: place.name,
          description: place.address,
          kind: "place",
        });
      }
    });

    return markers;
  }, [currentLocation, nearby, recommendations, searchHighlights, searchedLocation]);

  const topWeather = recommendations[0]?.weather?.headline || nearby?.weather.headline;
  const featuredHistory = searchHistory.slice(0, 6);

  return (
    <section id="trip-planner" className="container mx-auto scroll-mt-28 px-4 py-16 md:py-20">
      <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr),400px] lg:items-end">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-4 w-4" />
            SmartSpend Search + Planning
          </span>
          <h2 className="max-w-4xl font-heading text-4xl font-semibold tracking-[-0.06em] md:text-5xl xl:text-[3.7rem]">
            Real-time travel discovery with saved history, image-rich place cards, and AI itinerary guidance
          </h2>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Search a destination, save it to your personal travel history, inspect live place images and weather, then generate a structured itinerary and chat with full trip context.
          </p>
        </div>
        <div className="glass-card grid grid-cols-2 gap-3 p-3">
          {[
            ["Search History", "One-click re-search for saved destinations"],
            ["Real Images", "Foursquare photos with Unsplash fallback"],
            ["Trip Memory", "Searches, trips, and chat stay linked"],
            ["Map + Weather", "Plan with live coordinates and conditions"],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl bg-background/85 p-4">
              <p className="font-heading text-lg font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      {healthLoading ? (
        <div className="mb-6 rounded-[1.5rem] border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
          Checking API, database, and real-time service availability.
        </div>
      ) : null}

      {healthError ? (
        <div className="mb-6 rounded-[1.5rem] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>
                The frontend could not reach the backend health endpoint. Confirm
                `VITE_API_BASE_URL` in `frontend/.env` and make sure the API server is
                running.
              </p>
              <p className="mt-1 text-xs text-destructive/80">{healthError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/30 bg-background/80 text-destructive hover:bg-background"
              onClick={() => void loadHealth()}
              disabled={healthLoading}
            >
              {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {health?.warnings.length ? (
        <div className="mb-6 rounded-[1.5rem] border border-amber-300/40 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold text-foreground">Service setup required</p>
          <p className="mt-1">{health.warnings.join(" ")}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[390px,minmax(0,1fr)]">
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="glass-card space-y-6 p-7">
            <div className="space-y-2 border-b border-border pb-5">
              <h3 className="font-heading text-[1.9rem] font-semibold tracking-[-0.05em]">Planner Inputs</h3>
              <p className="text-[15px] text-muted-foreground">
                Your profile is reused for search history, chat context, and saved trip plans.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Full Name</label>
                <Input value={form.userName} onChange={(e) => update("userName", e.target.value)} placeholder="Aarav Sharma" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</label>
                <Input type="email" value={form.userEmail} onChange={(e) => update("userEmail", e.target.value)} placeholder="traveler@email.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-11" value={form.destination} onChange={(e) => update("destination", e.target.value)} placeholder="Mysore, India" />
              </div>
              {searchedLocation ? (
                <p className="text-sm text-muted-foreground">
                  Matched location: <span className="font-medium text-foreground">{searchedLocation.display_name}</span>
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Country Focus</label>
                <select className={selectClassName} value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)}>
                  {countries.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trip Style</label>
                <select className={selectClassName} value={form.tripType} onChange={(e) => update("tripType", e.target.value)}>
                  {tripTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Start Date</label>
                <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">End Date</label>
                <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Travelers</label>
                <Input type="number" min={1} max={20} value={form.travelers} onChange={(e) => update("travelers", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Currency</label>
                <select className={selectClassName} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                  {currencies.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Budget</label>
                <span className="text-sm font-medium text-muted-foreground">{money(form.budget, form.currency)}</span>
              </div>
              <Input type="number" min={100} step={100} value={form.budget} onChange={(e) => update("budget", Number(e.target.value))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stay Type</label>
                <select className={selectClassName} value={form.accommodationType} onChange={(e) => update("accommodationType", e.target.value)}>
                  {stays.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Transport</label>
                <select className={selectClassName} value={form.transportMode} onChange={(e) => update("transportMode", e.target.value)}>
                  {transportModes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trip Goals</p>
              <div className="flex flex-wrap gap-2.5">
                {goals.map((item) => (
                  <button key={item} type="button" onClick={() => toggle("preferences", item)} className={chipClassName(form.preferences.includes(item))}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Food Preferences</p>
              <div className="flex flex-wrap gap-2.5">
                {foods.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle("foodPreferences", item)}
                    className={chipClassName(form.foodPreferences.includes(item), "secondary")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Planner Notes</label>
              <Textarea rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Family trip, photography focus, prefer temples, avoid long transfers, and keep the food mostly vegetarian." />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="hero-outline" size="lg" className="w-full" onClick={() => void executeSearch({ suppressToast: false, resetTrip: true })} disabled={searchLoading || Boolean(searchBlockedMessage)}>
                {searchLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" /> Search Destination
                  </>
                )}
              </Button>
              <Button variant="hero" size="lg" className="w-full" onClick={() => void handleGenerate()} disabled={generating || Boolean(planBlockedMessage)}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Trip
                  </>
                )}
              </Button>
            </div>

            <Button variant="outline" size="lg" className="w-full" onClick={() => void handleNearby()} disabled={nearbyLoading || Boolean(nearbyBlockedMessage)}>
              {nearbyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Locating
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" /> Use Current Location
                </>
              )}
            </Button>

            {searchNeedsRefresh ? (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-900">
                Inputs changed after the last saved search. Run a fresh search to refresh images, weather, and budget guidance.
              </div>
            ) : null}

            {searchError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{searchError}</div> : null}
            {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
          </div>

          <div id="saved-trips" className="glass-card scroll-mt-28 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Search History</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold">Recent destination lookups</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Saved history loads from your account and does not use OpenAI quota.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void handleClearHistory()} disabled={historyLoading || !featuredHistory.length}>
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>

            {!form.userEmail.trim() ? (
              <p className="mt-4 text-sm text-muted-foreground">Add your email to load your saved searches.</p>
            ) : historyLoading ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : featuredHistory.length ? (
              <div className="mt-5 space-y-3">
                {featuredHistory.map((item) => {
                  const historyPreview = item.location_data.preview;
                  const historyImage = historyPreview?.destination_context.image_url || historyPreview?.recommended_places[0]?.image_url;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleHistorySelect(item)}
                      className={`flex w-full items-center gap-3 rounded-[1.35rem] border p-3 text-left transition ${activeSearchId === item.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/15 hover:bg-muted/40"}`}
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-muted">
                        <PlannerImage src={historyImage} alt={item.search_query} fallbackLabel={item.search_query} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{item.search_query}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{historyPreview?.destination_context.fullName || "Saved destination"}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Your searched destinations will appear here for one-click re-use.</p>
            )}
          </div>

          <div id="nearby-finder" className="glass-card scroll-mt-28 p-6">
            <h3 className="font-heading text-2xl font-semibold">Nearby Finder</h3>
            <p className="mt-2 text-[15px] text-muted-foreground">Live attractions and restaurants around your current location, filtered by your budget category.</p>
            {nearby ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
                  <div>
                    <p className="font-medium">{nearby.weather.headline}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Current location recommendations</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${badgeTone[nearby.budget_category]}`}>{nearby.budget_category}</span>
                </div>
                {([
                  { label: "Attractions", items: nearby.nearby.attractions },
                  { label: "Restaurants", items: nearby.nearby.restaurants },
                ] as const).map(({ label, items }) => (
                  <div key={String(label)} className="space-y-3">
                    <p className="font-heading text-lg font-semibold">{label}</p>
                    {items.map((item) => (
                      <a key={`${label}-${item.name}`} href={mapHref(item.latitude, item.longitude, item.name)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                        <div className="grid md:grid-cols-[104px,minmax(0,1fr)]">
                          <div className="h-full min-h-[104px] overflow-hidden bg-muted">
                            <PlannerImage src={item.imageUrl} alt={item.name} fallbackLabel={item.name} />
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between gap-3">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.address}</p>
                              </div>
                              {item.rating ? (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                                  <Star className="h-3.5 w-3.5 text-gold" />
                                  {item.rating.toFixed(1)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Use the location button to populate this panel.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div id="ai-advisor" className="glass-card scroll-mt-28 overflow-hidden">
            <div className="border-b border-border px-7 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Search Experience</p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold">Location, images, budget, weather, and top places</h3>
                </div>
                {budgetCategory ? <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase ${badgeTone[budgetCategory]}`}>{budgetCategory}</span> : null}
              </div>
            </div>

            {destinationContext ? (
              <div className="space-y-6 p-7">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(320px,0.85fr)]">
                  <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
                    <div className="relative h-full min-h-[21rem] overflow-hidden">
                      <PlannerImage src={destinationContext.image_url} alt={destinationContext.fullName} className="h-full w-full object-cover" fallbackLabel={destinationContext.fullName} />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                        <p className="text-xs uppercase tracking-[0.24em] text-background/70">Destination Spotlight</p>
                        <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em]">{destinationContext.fullName}</h3>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-background/90">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-sm">
                            <Wallet className="h-4 w-4" /> {money(breakdown?.daily_average || form.budget, form.currency)} avg/day
                          </span>
                          {topWeather ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-sm">
                              <Wind className="h-4 w-4" /> {topWeather}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur-sm">
                            <Compass className="h-4 w-4" /> {recommendations.length} ranked options
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-border bg-muted/50 p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Budget Split</p>
                    <div className="mt-5 space-y-4">
                      {(["transport", "stay", "food", "activities", "contingency"] as const).map((key) => {
                        const total = breakdown?.total || form.budget || 1;
                        const value = breakdown?.[key] || 0;
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize text-muted-foreground">{key}</span>
                              <span className="font-semibold text-foreground">{money(value, form.currency)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-background">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (value / total) * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-card p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Travelers</p>
                        <p className="mt-2 font-heading text-2xl font-semibold">{preview?.budget_profile.travelers || form.travelers}</p>
                      </div>
                      <div className="rounded-2xl bg-card p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trip Days</p>
                        <p className="mt-2 font-heading text-2xl font-semibold">{preview?.budget_profile.tripDays || result?.itinerary.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Image Gallery</p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold">Top attractions from this search</h3>
                  </div>
                  {searchHighlights.length ? (
                    <>
                      <div className="mb-5 grid gap-3 lg:grid-cols-2">
                        {searchDaySuggestions.map((day) => (
                          <div key={day.dayNumber} className="rounded-[1.5rem] border border-border bg-muted/40 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Day {day.dayNumber}
                                </p>
                                <p className="mt-2 font-heading text-xl font-semibold">
                                  {day.attractions[0]?.name || "Keep this day flexible"}
                                </p>
                              </div>
                              <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                                {day.attractions.length} stop{day.attractions.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            {day.attractions.length ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {day.attractions.map((item) => (
                                  <span
                                    key={`${day.dayNumber}-${item.id}`}
                                    className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                                  >
                                    {item.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-muted-foreground">
                                Use this slot for travel, rest, or a spontaneous local stop before generating the full itinerary.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {searchHighlights.map((item) => (
                        <a key={item.id} href={mapHref(item.latitude, item.longitude, `${item.name} ${item.city}`)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[1.5rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                          <div className="h-48 overflow-hidden bg-muted">
                            <PlannerImage src={item.image_url} alt={item.name} fallbackLabel={item.name} />
                          </div>
                          <div className="space-y-3 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-heading text-xl font-semibold">{item.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{item.city}, {item.state}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {item.rating ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                                    <Star className="h-3.5 w-3.5" /> {item.rating.toFixed(1)}
                                  </span>
                                ) : null}
                                {attractionDayLookup.get(item.id) ? (
                                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                                    Suggested for Day {attractionDayLookup.get(item.id)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              <span>{item.category}</span>
                              <span>{item.address}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                    </>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/30 px-5 py-10 text-center text-sm text-muted-foreground">
                      Run a destination search to load attraction cards and day-wise visit suggestions.
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Ranked Places</p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold">Best matches for your budget</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recommendations.map((place) => (
                      <div key={`${place.city}-${place.state}`} className="overflow-hidden rounded-[1.5rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                        <div className="h-48 overflow-hidden bg-muted">
                          <PlannerImage src={place.image_url} alt={place.city} fallbackLabel={place.city} />
                        </div>
                        <div className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-heading text-2xl font-semibold">{place.city}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{place.state}</p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Match</p>
                              <p className="mt-1 font-heading text-xl font-semibold">{place.score.toFixed(0)}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Estimated day spend</span>
                              <span className="font-semibold">{money(place.estimated_day_spend, form.currency)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Weather</span>
                              <span className="font-semibold">{place.weather?.headline || "Live data"}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{place.why_it_fits_budget || place.description || "Budget-aware recommendation."}</p>
                          <div className="flex flex-wrap gap-2">
                            {place.top_places.slice(0, 3).map((item) => (
                              <span key={item.name} className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
                                {item.name}
                              </span>
                            ))}
                          </div>
                          <a href={mapHref(place.coordinates?.latitude, place.coordinates?.longitude, `${place.city} ${place.state}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            <MapPin className="h-4 w-4" /> Open on map
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-7 py-14 text-center text-sm text-muted-foreground">
                Save a destination search to load image cards, weather-aware ranking, budget breakdowns, and map-ready place recommendations.
              </div>
            )}
          </div>

          <LocationMap
            markers={mapMarkers}
            emptyMessage="Search for a destination or use your current location to load the live OpenStreetMap view."
          />

          {result ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),minmax(320px,0.92fr)]">
              <div className="glass-card p-7">
                <h3 className="font-heading text-2xl font-semibold">Day-Wise Itinerary</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">Trip #{result.trip_id} was saved with itinerary rows, recommendation snapshots, and linked chat context.</p>
                <div className="mt-5 space-y-3">
                  {result.itinerary.map((day) => (
                    <details key={day.day_number} className="rounded-2xl border border-border p-5" open={day.day_number === 1}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div>
                          <p className="font-heading text-xl font-semibold">Day {day.day_number} - {day.theme}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{day.city}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{money(day.cost, form.currency)}</span>
                      </summary>
                      {(day.plan || []).length ? (
                        <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Time-Based Plan</p>
                          <p className="mt-2 text-sm text-foreground/85">
                            {sortPlanItems(day.plan || [])
                              .map((item) => `${item.time}: ${item.place}`)
                              .join(", ")}
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {sortPlanItems(day.plan || []).map((item) => (
                              <div
                                key={`${day.day_number}-${item.time}-${item.place}`}
                                className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                  {item.time}
                                </p>
                                <p className="mt-1 font-medium">{item.place}</p>
                                {item.note ? (
                                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3 border-l border-border pl-4">
                        {day.activities.map((activity) => (
                          <div key={`${day.day_number}-${activity.time}-${activity.name}`} className="rounded-2xl bg-muted/60 p-4">
                            <div className="flex justify-between gap-3">
                              <p className="font-medium">{activity.time} - {activity.name}</p>
                              <span className="text-sm font-semibold">{money(activity.estimated_cost, form.currency)}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{activity.description}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{activity.type} - {activity.tips}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="font-heading text-2xl font-semibold">Hidden Gems</h3>
                  <div className="mt-5 space-y-3">
                    {result.hidden_gems.map((gem) => (
                      <div key={`${gem.city}-${gem.name}`} className="rounded-2xl bg-muted/60 p-4">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-heading text-lg font-semibold">{gem.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{gem.city}</p>
                          </div>
                          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">{money(gem.estimated_cost, form.currency)}</span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{gem.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-heading text-2xl font-semibold">Tips</h3>
                  <div className="mt-4 space-y-3">
                    {result.tips.map((tip) => (
                      <div key={tip} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="glass-card overflow-hidden">
            <div className="bg-foreground px-7 py-5 text-background">
              <p className="text-xs uppercase tracking-[0.24em] text-background/60">AI Chat</p>
              <h3 className="mt-2 font-heading text-2xl font-semibold">Context-aware travel advisor</h3>
              <p className="mt-2 text-sm text-background/70">
                The assistant reads your latest search history entry and the active trip itinerary when available.
              </p>
            </div>
            <div className="space-y-4 bg-foreground/95 p-6">
              <div ref={chatScrollRef} className="max-h-[24rem] space-y-3 overflow-y-auto rounded-[1.5rem] bg-foreground/50 p-4">
                {chat.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/10 text-background"}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                  placeholder={
                    chatBlockedMessage
                      ? "Complete backend chat setup to use the assistant"
                      : destinationContext
                        ? `Ask about ${destinationContext.fullName}`
                        : "Search a destination to activate the assistant"
                  }
                  className="h-12 border-white/10 bg-white/10 text-background placeholder:text-background/50"
                  disabled={Boolean(chatBlockedMessage)}
                />
                <Button className="h-12 rounded-2xl" onClick={() => void handleChat()} disabled={chatLoading || Boolean(chatBlockedMessage)}>
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripPlanner;
