import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

const UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos";

const normalizeQuery = (query) => String(query || "").trim();

const buildUnsplashAsset = (photo, query) => {
  if (!photo?.urls?.regular) {
    return null;
  }

  const photographer = photo.user?.name || "Unsplash";
  return {
    url: photo.urls.regular,
    thumbnailUrl: photo.urls.small || photo.urls.thumb || photo.urls.regular,
    alt: photo.alt_description || query,
    source: "unsplash",
    attribution: `Photo by ${photographer} on Unsplash`,
  };
};

export const imageService = {
  async searchLandscape(query) {
    if (!env.unsplashAccessKey) {
      return null;
    }

    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) {
      return null;
    }

    const url = new URL(UNSPLASH_SEARCH_URL);
    url.searchParams.set("query", normalizedQuery);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${env.unsplashAccessKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Unsplash request failed: ${await response.text()}`);
    }

    const payload = await response.json();
    return buildUnsplashAsset(payload.results?.[0], normalizedQuery);
  },
};
