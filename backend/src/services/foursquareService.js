import { env, assertEnv } from "../config/env.js";
import {
  buildDemoCityInsights,
  buildDemoNearbySpots,
  discoverDemoLocalities,
} from "../data/demoTravelData.js";
import { ApiError } from "../utils/errors.js";
import { imageService } from "./imageService.js";

const FOURSQUARE_SEARCH_URL = "https://api.foursquare.com/v3/places/search";
const FOURSQUARE_PLACES_URL = "https://api.foursquare.com/v3/places";

const average = (values) => {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length
    ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length
    : 0;
};

const uniqueQueries = (queries) => {
  const seen = new Set();
  return queries.filter((query) => {
    const key = query.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizePlace = (place) => ({
  id: place.fsq_id,
  fsqId: place.fsq_id,
  name: place.name,
  address:
    place.location?.formatted_address ||
    [place.location?.address, place.location?.locality, place.location?.region]
      .filter(Boolean)
      .join(", "),
  city: place.location?.locality || "",
  region: place.location?.region || "",
  country: place.location?.country || "",
  latitude: place.geocodes?.main?.latitude ?? null,
  longitude: place.geocodes?.main?.longitude ?? null,
  rating: place.rating ?? null,
  popularity: place.popularity ?? place.stats?.total_ratings ?? 0,
  priceLevel: place.price ?? null,
  categories: (place.categories || []).map((category) => category.name),
  website: place.website || "",
  description: place.description || "",
  imageUrl: "",
  thumbnailUrl: "",
  imageSource: "",
  imageAttribution: "",
  photos: [],
});

const buildPhotoAsset = (photo, placeName) => {
  if (!photo?.prefix || !photo?.suffix) {
    return null;
  }

  const mainSize = photo.width && photo.height ? `${Math.min(1200, photo.width)}x${Math.min(900, photo.height)}` : "900x600";
  const thumbSize = photo.width && photo.height ? `${Math.min(480, photo.width)}x${Math.min(360, photo.height)}` : "480x360";

  return {
    url: `${photo.prefix}${mainSize}${photo.suffix}`,
    thumbnailUrl: `${photo.prefix}${thumbSize}${photo.suffix}`,
    alt: placeName,
    source: "foursquare",
    attribution: "Photo via Foursquare",
  };
};

const buildImageFallbackQuery = (place, params = {}) =>
  [
    place.name,
    place.city || params.near || "",
    place.region || "",
    place.categories?.[0] || "travel",
  ]
    .filter(Boolean)
    .join(" ");

const getPriceWindow = (budgetCategory) => {
  if (budgetCategory === "low") {
    return { minPrice: 1, maxPrice: 2 };
  }
  if (budgetCategory === "luxury") {
    return { minPrice: 3, maxPrice: 4 };
  }
  return { minPrice: 1, maxPrice: 3 };
};

const pickPrimaryQuery = (preferences = [], tripType = "Leisure") => {
  const lower = preferences.map((item) => item.toLowerCase());

  if (lower.some((item) => item.includes("adventure")) || tripType === "Adventure") {
    return "outdoor adventure";
  }
  if (lower.some((item) => item.includes("culture")) || lower.some((item) => item.includes("history"))) {
    return "historic site";
  }
  if (lower.some((item) => item.includes("wellness"))) {
    return "wellness retreat";
  }
  if (lower.some((item) => item.includes("photography"))) {
    return "scenic viewpoint";
  }
  return "tourist attraction";
};

const requestPlaces = async (params) => {
  const url = new URL(FOURSQUARE_SEARCH_URL);
  url.searchParams.set("limit", String(params.limit || 10));
  url.searchParams.set(
    "fields",
    [
      "fsq_id",
      "name",
      "location",
      "geocodes",
      "categories",
      "rating",
      "stats",
      "popularity",
      "price",
      "website",
      "description",
    ].join(","),
  );

  if (params.query) {
    url.searchParams.set("query", params.query);
  }
  if (params.near) {
    url.searchParams.set("near", params.near);
  }
  if (params.latitude && params.longitude) {
    url.searchParams.set("ll", `${params.latitude},${params.longitude}`);
  }
  if (params.radius) {
    url.searchParams.set("radius", String(params.radius));
  }
  if (params.sort) {
    url.searchParams.set("sort", params.sort);
  }
  if (params.minPrice) {
    url.searchParams.set("min_price", String(params.minPrice));
  }
  if (params.maxPrice) {
    url.searchParams.set("max_price", String(params.maxPrice));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: env.foursquareApiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Foursquare request failed: ${await response.text()}`);
  }

  return response.json();
};

const requestPlacePhotos = async (fsqId, limit = 2) => {
  const url = new URL(`${FOURSQUARE_PLACES_URL}/${fsqId}/photos`);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: {
      Authorization: env.foursquareApiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Foursquare photo request failed: ${await response.text()}`);
  }

  return response.json();
};

const attachPlaceMedia = async (place, params = {}) => {
  try {
    let photoAssets = [];

    if (place.fsqId) {
      const photos = await requestPlacePhotos(place.fsqId, 3).catch(() => []);
      photoAssets = (Array.isArray(photos) ? photos : [])
        .map((photo) => buildPhotoAsset(photo, place.name))
        .filter(Boolean);
    }

    if (photoAssets.length) {
      return {
        ...place,
        imageUrl: photoAssets[0].url,
        thumbnailUrl: photoAssets[0].thumbnailUrl,
        imageSource: photoAssets[0].source,
        imageAttribution: photoAssets[0].attribution,
        photos: photoAssets,
      };
    }

    const fallbackImage = await imageService
      .searchLandscape(buildImageFallbackQuery(place, params))
      .catch(() => null);

    if (!fallbackImage) {
      return place;
    }

    return {
      ...place,
      imageUrl: fallbackImage.url,
      thumbnailUrl: fallbackImage.thumbnailUrl,
      imageSource: fallbackImage.source,
      imageAttribution: fallbackImage.attribution,
      photos: [fallbackImage],
    };
  } catch {
    return place;
  }
};

const enrichPlacesWithMedia = async (places, params = {}) => {
  const mediaLimit = Math.max(0, Math.min(places.length, params.photoLimit || 0));
  if (!mediaLimit) {
    return places;
  }

  const enriched = await Promise.all(
    places.map((place, index) =>
      index < mediaLimit ? attachPlaceMedia(place, params) : Promise.resolve(place),
    ),
  );

  return enriched;
};

export const foursquareService = {
  async searchPlaces(params) {
    if (env.demoMode) {
      const demoInsights = buildDemoCityInsights({
        city: params.near || "Demo City",
        latitude: Number(params.latitude) || 23.5937,
        longitude: Number(params.longitude) || 78.9629,
        budgetCategory: "mid",
        preferences: [],
        tripType: "Leisure",
      });

      if ((params.query || "").toLowerCase().includes("restaurant")) {
        return demoInsights.foodSpots;
      }
      if ((params.query || "").toLowerCase().includes("hotel")) {
        return demoInsights.stays;
      }

      return demoInsights.attractions;
    }

    try {
      assertEnv("foursquareApiKey");
      const payload = await requestPlaces(params);
      const places = (payload.results || []).map(normalizePlace);
      return enrichPlacesWithMedia(places, params);
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      const demoInsights = buildDemoCityInsights({
        city: params.near || "Demo City",
        latitude: Number(params.latitude) || 23.5937,
        longitude: Number(params.longitude) || 78.9629,
        budgetCategory: "mid",
        preferences: [],
        tripType: "Leisure",
      });

      if ((params.query || "").toLowerCase().includes("restaurant")) {
        return demoInsights.foodSpots;
      }
      if ((params.query || "").toLowerCase().includes("hotel")) {
        return demoInsights.stays;
      }

      return demoInsights.attractions;
    }
  },

  summarizePlaces(places) {
    return {
      count: places.length,
      averageRating: average(places.map((place) => place.rating)),
      averagePriceLevel: average(places.map((place) => place.priceLevel)),
      popularity: average(places.map((place) => place.popularity)),
    };
  },

  async getCityInsights({ city, latitude, longitude, budgetCategory, preferences, tripType }) {
    if (env.demoMode) {
      return buildDemoCityInsights({
        city,
        latitude,
        longitude,
        budgetCategory,
        preferences,
        tripType,
      });
    }

    try {
      const priceWindow = getPriceWindow(budgetCategory);
      const attractionQuery = pickPrimaryQuery(preferences, tripType);

      const [attractions, foodSpots, stays] = await Promise.all([
        this.searchPlaces({
          latitude,
          longitude,
          radius: 22000,
          limit: 12,
          sort: "RATING",
          query: attractionQuery,
          photoLimit: 6,
        }),
        this.searchPlaces({
          latitude,
          longitude,
          radius: 18000,
          limit: 10,
          sort: "RATING",
          query: "restaurant",
          minPrice: priceWindow.minPrice,
          maxPrice: priceWindow.maxPrice,
          photoLimit: 4,
        }),
        this.searchPlaces({
          latitude,
          longitude,
          radius: 18000,
          limit: 8,
          sort: "RATING",
          query: "hotel",
          minPrice: priceWindow.minPrice,
          maxPrice: priceWindow.maxPrice,
          photoLimit: 3,
        }),
      ]);

      const allPlaces = [...attractions, ...foodSpots, ...stays];
      const popularityMedian =
        allPlaces
          .map((place) => place.popularity || 0)
          .sort((left, right) => left - right)[Math.floor(allPlaces.length / 2)] || 0;

      return {
        city,
        attractions,
        foodSpots,
        stays,
        hiddenGems: attractions
          .filter((place) => (place.rating || 0) >= 7.8 && (place.popularity || 0) <= popularityMedian)
          .slice(0, 4),
        attractionMetrics: this.summarizePlaces(attractions),
        foodMetrics: this.summarizePlaces(foodSpots),
        stayMetrics: this.summarizePlaces(stays),
      };
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return buildDemoCityInsights({
        city,
        latitude,
        longitude,
        budgetCategory,
        preferences,
        tripType,
      });
    }
  },

  async discoverLocalitiesBySampling(samplePoints, preferences, tripType) {
    if (env.demoMode) {
      return [];
    }

    try {
      assertEnv("foursquareApiKey");
      const localities = new Map();
      const samplingQueries = uniqueQueries([
        pickPrimaryQuery(preferences, tripType),
        "tourist attraction",
        "hotel",
        "restaurant",
      ]);

      for (const point of samplePoints) {
        let places = [];

        for (const query of samplingQueries) {
          places = await this.searchPlaces({
            latitude: point.latitude,
            longitude: point.longitude,
            radius: 70000,
            limit: 8,
            sort: "RATING",
            query,
          }).catch(() => []);

          if (places.length) {
            break;
          }
        }

        for (const place of places) {
          const locality = place.city || place.region;
          if (!locality) {
            continue;
          }

          const existing = localities.get(locality) || { name: locality, hits: 0 };
          localities.set(locality, { ...existing, hits: existing.hits + 1 });
        }
      }

      return [...localities.values()]
        .sort((left, right) => right.hits - left.hits)
        .slice(0, 6);
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return samplePoints.length
        ? discoverDemoLocalities({
            name: "India",
            region: "India",
            district: "",
            featureType: "country",
            country: "India",
          })
        : [];
    }
  },

  async getNearbySpots({ latitude, longitude, budgetCategory }) {
    if (env.demoMode) {
      return buildDemoNearbySpots({ latitude, longitude, budgetCategory });
    }

    try {
      const priceWindow = getPriceWindow(budgetCategory);
      const [attractions, restaurants] = await Promise.all([
        this.searchPlaces({
          latitude,
          longitude,
          radius: 9000,
          limit: 6,
          sort: "RATING",
          query: "tourist attraction",
          photoLimit: 4,
        }),
        this.searchPlaces({
          latitude,
          longitude,
          radius: 5000,
          limit: 6,
          sort: "RATING",
          query: "restaurant",
          minPrice: priceWindow.minPrice,
          maxPrice: priceWindow.maxPrice,
          photoLimit: 4,
        }),
      ]);

      return { attractions, restaurants };
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return buildDemoNearbySpots({ latitude, longitude, budgetCategory });
    }
  },
};
