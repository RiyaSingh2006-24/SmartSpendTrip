import { env } from "../config/env.js";
import {
  discoverDemoLocalities,
  findNearestDemoLocation,
  getDemoLocationByName,
  searchDemoLocations,
} from "../data/demoTravelData.js";
import { ApiError } from "../utils/errors.js";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_CACHE_TTL_MS = 30 * 60 * 1000;
const NOMINATIM_MIN_INTERVAL_MS = 1200;
const DEFAULT_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
  "User-Agent": "SmartSpend Trip AI/1.0 (OpenStreetMap Nominatim integration)",
};
const responseCache = new Map();
const inflightRequests = new Map();
let requestQueue = Promise.resolve();
let lastRequestStartedAt = 0;

const toBBox = (boundingBox) => {
  if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
    return null;
  }

  const [south, north, west, east] = boundingBox.map(Number);
  if ([south, north, west, east].some((value) => !Number.isFinite(value))) {
    return null;
  }

  return [west, south, east, north];
};

const pickName = (place) =>
  place.name ||
  place.address?.city ||
  place.address?.town ||
  place.address?.village ||
  place.address?.municipality ||
  place.address?.county ||
  place.address?.state ||
  place.display_name?.split(",")[0]?.trim() ||
  "";

const pickLocalityName = (place) =>
  place.address?.city ||
  place.address?.town ||
  place.address?.village ||
  place.address?.municipality ||
  place.address?.county ||
  place.address?.state_district ||
  pickName(place);

const uniqueNames = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item?.name?.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const resolveKnownLocationAlias = (query, options = {}) => {
  const knownLocation =
    getDemoLocationByName(query, options.countryCode ? { countryCode: options.countryCode } : {}) ||
    getDemoLocationByName(query);

  return knownLocation?.fullName || query;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readCachedValue = (key) => {
  const cached = responseCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return cached.value;
};

const cacheValue = (key, value) => {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + NOMINATIM_CACHE_TTL_MS,
  });
};

const normalizePlace = (place) => ({
  name: pickName(place),
  fullName: place.display_name || pickName(place),
  latitude: Number(place.lat),
  longitude: Number(place.lon),
  featureType: place.type || place.addresstype || "place",
  country: place.address?.country || "",
  countryCode: place.address?.country_code?.toUpperCase() || "",
  region: place.address?.state || place.address?.region || place.address?.state_district || "",
  regionCode: "",
  city:
    place.address?.city ||
    place.address?.town ||
    place.address?.village ||
    place.address?.municipality ||
    pickName(place),
  district: place.address?.state_district || place.address?.county || "",
  bbox: toBBox(place.boundingbox),
  displayName: place.display_name || pickName(place),
});

const buildSearchUrl = (query, options = {}) => {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(options.limit || 1));

  if (options.countryCode) {
    url.searchParams.set("countrycodes", options.countryCode.toLowerCase());
  }

  if (options.bbox?.length === 4) {
    const [west, south, east, north] = options.bbox;
    url.searchParams.set("viewbox", `${west},${north},${east},${south}`);
    url.searchParams.set("bounded", "1");
  }

  return url;
};

const buildReverseUrl = (latitude, longitude) => {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  return url;
};

const queueRequest = (work) => {
  const next = requestQueue.catch(() => undefined).then(work);
  requestQueue = next.catch(() => undefined);
  return next;
};

const buildLocationError = async (response) => {
  const body = (await response.text()).trim();

  if (response.status === 429) {
    return new ApiError(
      429,
      "Location service is busy right now because too many map lookups were sent. Please wait a few seconds and try again.",
    );
  }

  if (body.startsWith("<")) {
    return new ApiError(response.status, `Nominatim request failed with status ${response.status}.`);
  }

  return new ApiError(response.status, `Nominatim request failed: ${body || response.statusText}`);
};

const fetchJson = async (url) => {
  const key = url.toString();
  const cached = readCachedValue(key);
  if (cached) {
    return cached;
  }

  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight;
  }

  const request = queueRequest(async () => {
    const delay = Math.max(0, lastRequestStartedAt + NOMINATIM_MIN_INTERVAL_MS - Date.now());
    if (delay > 0) {
      await wait(delay);
    }

    lastRequestStartedAt = Date.now();
    const response = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!response.ok) {
      throw await buildLocationError(response);
    }

    const payload = await response.json();
    cacheValue(key, payload);
    return payload;
  });

  inflightRequests.set(key, request);

  try {
    return await request;
  } finally {
    inflightRequests.delete(key);
  }
};

export const locationService = {
  async searchLocation(query, options = {}) {
    const normalizedQuery = resolveKnownLocationAlias(query, options);

    if (env.demoMode) {
      return searchDemoLocations(normalizedQuery, {
        countryCode: options.countryCode,
        limit: options.limit || 1,
      });
    }

    try {
      const payload = await fetchJson(buildSearchUrl(normalizedQuery, options));
      const matches = Array.isArray(payload) ? payload : [];

      if (!matches.length) {
        throw new ApiError(404, `No location found for "${query}"`);
      }

      return matches.map(normalizePlace);
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return searchDemoLocations(query, {
        countryCode: options.countryCode,
        limit: options.limit || 1,
      });
    }
  },

  async geocodeDestination(query, options = {}) {
    const [location] = await this.searchLocation(query, options);
    return location;
  },

  async geocodeSeed(seed, destinationContext) {
    const seedLower = seed.trim().toLowerCase();
    const parts = [
      seed,
      destinationContext.region &&
      !seedLower.includes(destinationContext.region.trim().toLowerCase())
        ? destinationContext.region
        : "",
      destinationContext.country &&
      !seedLower.includes(destinationContext.country.trim().toLowerCase())
        ? destinationContext.country
        : "",
    ].filter(Boolean);

    return this.geocodeDestination(parts.join(", "), {
      limit: 1,
      countryCode: destinationContext.countryCode,
      bbox: destinationContext.bbox || undefined,
    });
  },

  async reverseGeocode(latitude, longitude) {
    if (env.demoMode) {
      return {
        ...findNearestDemoLocation(latitude, longitude),
        displayName: findNearestDemoLocation(latitude, longitude).fullName,
      };
    }

    const payload = await fetchJson(buildReverseUrl(latitude, longitude));
    if (!payload || typeof payload !== "object") {
      throw new ApiError(404, "No location found for the sampled coordinates.");
    }

    return normalizePlace(payload);
  },

  async discoverLocalitySeeds(destinationContext) {
    const samplePoints = this.buildSamplePoints(destinationContext);
    const sampledLocations = await Promise.all(
      samplePoints.map((point) =>
        this.reverseGeocode(point.latitude, point.longitude).catch(() => null),
      ),
    );

    const fallbackNames = [
      destinationContext.city,
      destinationContext.district,
      destinationContext.name,
    ]
      .filter(Boolean)
      .map((name) => ({ name, source: "destination" }));

    const localitySeeds = sampledLocations
      .filter(Boolean)
      .map((location) => ({
        name: pickLocalityName(location),
        source: "reverse",
      }));

    const demoSeeds = env.demoMode ? discoverDemoLocalities(destinationContext) : [];

    return uniqueNames([...localitySeeds, ...demoSeeds, ...fallbackNames]);
  },

  buildSamplePoints(destinationContext) {
    const points = [];

    if (destinationContext.latitude && destinationContext.longitude) {
      points.push({
        latitude: destinationContext.latitude,
        longitude: destinationContext.longitude,
      });
    }

    if (destinationContext.bbox?.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = destinationContext.bbox;
      const midLng = (minLng + maxLng) / 2;
      const midLat = (minLat + maxLat) / 2;

      points.push(
        { latitude: midLat, longitude: midLng },
        { latitude: maxLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
        { latitude: minLat, longitude: minLng },
        { latitude: minLat, longitude: maxLng },
      );
    }

    return points
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .filter(
        (point, index, list) =>
          list.findIndex(
            (candidate) =>
              candidate.latitude === point.latitude && candidate.longitude === point.longitude,
          ) === index,
      )
      .slice(0, 5);
  },
};
