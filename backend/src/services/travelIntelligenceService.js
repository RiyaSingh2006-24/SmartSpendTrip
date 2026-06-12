import { budgetService } from "./budgetService.js";
import { locationService } from "./locationService.js";
import { openaiService } from "./openaiService.js";
import { foursquareService } from "./foursquareService.js";
import { weatherService } from "./weatherService.js";
import {
  buildDemoCityInsights,
  buildDemoWeatherSummary,
  discoverDemoLocalities,
  getDemoLocationByName,
} from "../data/demoTravelData.js";
import { ApiError } from "../utils/errors.js";

const uniqueBy = (items, selector) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = selector(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const isSpecificLocality = (featureType) =>
  ["place", "locality", "neighborhood", "district"].includes(featureType);

const buildPlaceHighlights = (city) =>
  [
    ...city.insights.attractions.slice(0, 3),
    ...city.insights.foodSpots.slice(0, 2),
    ...city.insights.stays.slice(0, 2),
  ].slice(0, 5);

const buildSearchAttractionHighlights = (city) =>
  uniqueBy(
    [...city.insights.attractions, ...city.insights.hiddenGems].filter(Boolean),
    (place) => normalizeKey(place.name),
  ).slice(0, 4);

const parseDestinationState = (destinationContext) =>
  destinationContext.region || destinationContext.district || destinationContext.country || "";

const pickPrimaryImage = (items = []) => {
  const image = items.find((item) => item?.imageUrl)?.imageUrl;
  return image || "";
};

const pickPrimaryAttribution = (items = []) => {
  const attribution = items.find((item) => item?.imageAttribution)?.imageAttribution;
  return attribution || "";
};

const buildRecommendedPlace = (city) => {
  const topPlaces = buildPlaceHighlights(city);
  const allVisualPlaces = [...topPlaces, ...city.insights.hiddenGems];

  return {
    city: city.name,
    state: city.region || city.country || "",
    score: city.score.overallScore,
    budget_fit_score: city.score.budgetFitScore,
    rating_score: city.score.ratingScore,
    price_level: city.score.priceLevel,
    why_it_fits_budget: city.score.reasons.join(" "),
    estimated_day_spend: city.score.dailySpendEstimate,
    rating: city.score.ratingScore / 10,
    weather: city.weatherSummary,
    reasons: city.score.reasons,
    description: city.score.reasons.slice(0, 2).join(" "),
    coordinates: { latitude: city.latitude, longitude: city.longitude },
    image_url: pickPrimaryImage(allVisualPlaces),
    image_attribution: pickPrimaryAttribution(allVisualPlaces),
    top_places: topPlaces,
    hidden_gems: city.insights.hiddenGems,
  };
};

const buildSearchHighlights = (rankedCities) =>
  uniqueBy(
    rankedCities.flatMap((city) =>
      buildSearchAttractionHighlights(city)
        .slice(0, 3)
        .map((place) => ({
          id: `${normalizeKey(city.name)}-${normalizeKey(place.name)}`,
          city: city.name,
          state: city.region || city.country || "",
          name: place.name,
          category: place.categories?.[0] || "Attraction",
          description: place.description || `Top sightseeing stop in ${city.name}.`,
          address: place.address,
          rating: place.rating,
          latitude: place.latitude,
          longitude: place.longitude,
          image_url: place.imageUrl || "",
          image_attribution: place.imageAttribution || "",
        })),
    ),
    (item) => item.id,
  ).slice(0, 9);

const mergeAiTopPlaces = (aiTopPlaces = [], baseTopPlaces = []) =>
  aiTopPlaces.map((aiPlace) => {
    const matched = baseTopPlaces.find(
      (basePlace) => normalizeKey(basePlace.name) === normalizeKey(aiPlace.name),
    );

    return {
      ...matched,
      ...aiPlace,
      address: aiPlace.address || matched?.address || "",
      description: matched?.description || "",
      imageUrl: matched?.imageUrl || "",
      thumbnailUrl: matched?.thumbnailUrl || "",
      imageSource: matched?.imageSource || "",
      imageAttribution: matched?.imageAttribution || "",
    };
  });

const mergeRecommendedPlaces = (aiPlaces = [], basePlaces = []) => {
  if (!aiPlaces.length) {
    return basePlaces;
  }

  const baseByKey = new Map(
    basePlaces.map((place) => [`${normalizeKey(place.city)}|${normalizeKey(place.state)}`, place]),
  );

  return aiPlaces.map((aiPlace) => {
    const basePlace =
      baseByKey.get(`${normalizeKey(aiPlace.city)}|${normalizeKey(aiPlace.state)}`) ||
      basePlaces.find((place) => normalizeKey(place.city) === normalizeKey(aiPlace.city));

    return {
      ...basePlace,
      ...aiPlace,
      weather: basePlace?.weather,
      coordinates: basePlace?.coordinates,
      rating: aiPlace.rating ?? basePlace?.rating,
      reasons: basePlace?.reasons || [],
      description: aiPlace.why_it_fits_budget || basePlace?.description || "",
      image_url: basePlace?.image_url || "",
      image_attribution: basePlace?.image_attribution || "",
      hidden_gems: basePlace?.hidden_gems || [],
      top_places: aiPlace.top_places?.length
        ? mergeAiTopPlaces(aiPlace.top_places, basePlace?.top_places || [])
        : basePlace?.top_places || [],
    };
  });
};

const buildDestinationContext = (destinationContext, recommendedPlaces, searchHighlights) => ({
  ...destinationContext,
  image_url:
    recommendedPlaces.find((place) => place.image_url)?.image_url ||
    searchHighlights[0]?.image_url ||
    "",
  image_attribution:
    recommendedPlaces.find((place) => place.image_attribution)?.image_attribution ||
    searchHighlights[0]?.image_attribution ||
    "",
});

const TIME_SLOT_ORDER = {
  Morning: 0,
  Afternoon: 1,
  Evening: 2,
  Night: 3,
};

const normalizeTimeSlot = (value) => {
  const input = String(value || "").trim();
  if (!input) {
    return "Morning";
  }

  const lower = input.toLowerCase();
  if (lower.includes("morning")) {
    return "Morning";
  }
  if (lower.includes("afternoon")) {
    return "Afternoon";
  }
  if (lower.includes("evening")) {
    return "Evening";
  }
  if (lower.includes("night")) {
    return "Night";
  }

  const match = input.match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    return "Morning";
  }

  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) {
    return "Morning";
  }

  if (hour >= 5 && hour < 12) {
    return "Morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Afternoon";
  }
  if (hour >= 17 && hour < 21) {
    return "Evening";
  }

  return "Night";
};

const buildDayPlan = (activities = []) =>
  activities
    .map((activity) => ({
      place: activity.name,
      time: normalizeTimeSlot(activity.time),
      note: activity.tips || activity.description || "",
    }))
    .sort(
      (left, right) =>
        (TIME_SLOT_ORDER[left.time] ?? Number.MAX_SAFE_INTEGER) -
        (TIME_SLOT_ORDER[right.time] ?? Number.MAX_SAFE_INTEGER),
    );

const resolveFallbackCatalogLocations = (destinationContext, seedCandidates = []) => {
  const demoSeeds = discoverDemoLocalities(destinationContext);
  const preferredNames = uniqueBy(
    [
      ...seedCandidates.map((seed) => ({ name: seed.name })),
      ...demoSeeds,
      { name: destinationContext.city || destinationContext.name },
      { name: destinationContext.region },
      { name: destinationContext.country },
    ].filter((item) => item?.name),
    (item) => normalizeKey(item.name),
  );

  const resolvedLocations = uniqueBy(
    preferredNames
      .map((item) => {
        const countryOptions = destinationContext.countryCode
          ? { countryCode: destinationContext.countryCode }
          : {};

        return (
          getDemoLocationByName(item.name, countryOptions) ||
          getDemoLocationByName(item.name) ||
          null
        );
      })
      .filter(Boolean),
    (location) =>
      `${normalizeKey(location.name)}|${normalizeKey(location.region)}|${normalizeKey(location.country)}`,
  );

  const specificLocations = resolvedLocations.filter(
    (location) => location.featureType === "city" || isSpecificLocality(location.featureType),
  );

  return specificLocations.length ? specificLocations : resolvedLocations;
};

export const travelIntelligenceService = {
  async buildDestinationPreview(request) {
    const plan = await this.buildTripPlan(request, { previewOnly: true });
    const recommendedPlaces = plan.rankedCities.map(buildRecommendedPlace);
    const searchHighlights = buildSearchHighlights(plan.rankedCities);

    return {
      destination_context: buildDestinationContext(
        plan.destinationContext,
        recommendedPlaces,
        searchHighlights,
      ),
      budget_profile: plan.budgetProfile,
      budget_breakdown: plan.budgetBreakdown,
      recommended_places: recommendedPlaces,
      search_highlights: searchHighlights,
    };
  },

  async buildTripPlan(request, options = {}) {
    const budgetProfile = budgetService.buildBudgetProfile(request);
    const destinationContext = await locationService.geocodeDestination(request.destination, {
      countryCode: request.countryCode,
    });

    const seedCandidates = await this.getSeedCandidates(request, destinationContext, budgetProfile);
    if (!seedCandidates.length) {
      throw new ApiError(404, "No candidate cities could be discovered for this destination.");
    }

    let rankedCities = await this.rankCandidateCities(
      seedCandidates,
      request,
      destinationContext,
      budgetProfile,
    );
    if (!rankedCities.length) {
      rankedCities = this.buildCatalogFallbackCities(
        seedCandidates,
        request,
        destinationContext,
        budgetProfile,
      );
    }
    if (!rankedCities.length) {
      throw new ApiError(
        404,
        "No real place data was returned for this trip. Check API keys and destination coverage.",
      );
    }

    const budgetBreakdown = budgetService.buildBudgetBreakdown(budgetProfile);
    if (options.previewOnly) {
      return { destinationContext, budgetProfile, budgetBreakdown, rankedCities };
    }

    const aiPlan = await openaiService.generateItinerary({
      tripRequest: request,
      destinationContext,
      rankedCities,
      budgetBreakdown,
    });

    return { destinationContext, budgetProfile, budgetBreakdown, rankedCities, aiPlan };
  },

  async getSeedCandidates(request, destinationContext, budgetProfile) {
    if (isSpecificLocality(destinationContext.featureType)) {
      return [{ name: destinationContext.city || destinationContext.name, source: "direct" }];
    }

    const samplePoints = locationService.buildSamplePoints(destinationContext);
    const [aiSeeds, sampledLocalities, geocodedLocalities] = await Promise.all([
      openaiService
        .generateCandidateSeeds({
          destinationContext,
          budgetProfile,
          preferences: request.preferences,
          tripType: request.tripType,
        })
        .catch(() => ({ seeds: [] })),
      foursquareService
        .discoverLocalitiesBySampling(samplePoints, request.preferences, request.tripType)
        .catch(() => []),
      locationService.discoverLocalitySeeds(destinationContext).catch(() => []),
    ]);

    const candidates = uniqueBy(
      [
        ...(aiSeeds.seeds || []).map((seed) => ({ name: seed.name, source: "ai" })),
        ...sampledLocalities.map((seed) => ({ name: seed.name, source: "sampling" })),
        ...geocodedLocalities,
      ],
      (item) => item.name.toLowerCase(),
    ).slice(0, 8);

    return candidates.length
      ? candidates
      : [{ name: destinationContext.city || destinationContext.name, source: "fallback" }];
  },

  async rankCandidateCities(seedCandidates, request, destinationContext, budgetProfile) {
    const cities = [];

    for (const seed of seedCandidates) {
      let geo;
      try {
        geo = await locationService.geocodeSeed(seed.name, destinationContext);
      } catch {
        continue;
      }

      if (!geo.latitude || !geo.longitude) {
        continue;
      }

      const duplicate = cities.some(
        (city) =>
          city.name.toLowerCase() === geo.name.toLowerCase() &&
          city.region?.toLowerCase() === (geo.region || "").toLowerCase(),
      );
      if (duplicate) {
        continue;
      }

      let insights;
      let weatherSummary;
      try {
        [insights, weatherSummary] = await Promise.all([
          foursquareService.getCityInsights({
            city: geo.name,
            latitude: geo.latitude,
            longitude: geo.longitude,
            budgetCategory: budgetProfile.budgetCategory,
            preferences: request.preferences,
            tripType: request.tripType,
          }),
          weatherService.getWeatherSummary(geo.latitude, geo.longitude),
        ]);
      } catch {
        continue;
      }

      const placeCount =
        insights.attractions.length + insights.foodSpots.length + insights.stays.length;
      if (placeCount < 5) {
        continue;
      }

      cities.push({
        ...geo,
        insights,
        weatherSummary,
        score: budgetService.scoreCity({
          budgetProfile,
          cityInsights: insights,
          weatherSummary,
          destinationName: geo.name,
        }),
      });
    }

    return cities
      .sort((left, right) => right.score.overallScore - left.score.overallScore)
      .slice(0, 4);
  },

  buildCatalogFallbackCities(seedCandidates, request, destinationContext, budgetProfile) {
    const fallbackLocations = resolveFallbackCatalogLocations(destinationContext, seedCandidates);

    return fallbackLocations
      .map((location) => {
        const insights = buildDemoCityInsights({
          city: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          budgetCategory: budgetProfile.budgetCategory,
          preferences: request.preferences,
          tripType: request.tripType,
          countryCode: location.countryCode || destinationContext.countryCode,
        });
        const weatherSummary = buildDemoWeatherSummary({
          latitude: location.latitude,
          longitude: location.longitude,
          region: location.region,
          country: location.country,
        });

        return {
          ...location,
          insights,
          weatherSummary,
          score: budgetService.scoreCity({
            budgetProfile,
            cityInsights: insights,
            weatherSummary,
            destinationName: location.name,
          }),
          source: "catalog-fallback",
        };
      })
      .sort((left, right) => right.score.overallScore - left.score.overallScore)
      .slice(0, 4);
  },

  buildApiResponse(plan) {
    const suggestedPlaces = plan.rankedCities.map(buildRecommendedPlace);
    const recommendedPlaces = mergeRecommendedPlaces(plan.aiPlan?.recommended_places || [], suggestedPlaces);
    const searchHighlights = buildSearchHighlights(plan.rankedCities);

    return {
      destination_context: buildDestinationContext(
        plan.destinationContext,
        recommendedPlaces,
        searchHighlights,
      ),
      recommended_places: recommendedPlaces,
      itinerary:
        plan.aiPlan?.itinerary?.map((day) => ({
          day: day.day_number,
          day_number: day.day_number,
          theme: day.theme,
          city: day.city,
          cost: day.estimated_cost,
          plan: buildDayPlan(day.activities),
          activities: day.activities,
        })) || [],
      budget_breakdown: plan.aiPlan?.budget_breakdown || plan.budgetBreakdown,
      hidden_gems:
        plan.aiPlan?.hidden_gems?.length > 0
          ? plan.aiPlan.hidden_gems
          : plan.rankedCities.flatMap((city) => city.insights.hiddenGems).slice(0, 6),
      tips: plan.aiPlan?.tips || [],
      search_highlights: searchHighlights,
      ranking_debug: plan.rankedCities.map((city) => ({
        city: city.name,
        state: city.region || city.country || "",
        score: city.score,
      })),
      storage_payload: {
        state: parseDestinationState(plan.destinationContext),
        suggested_places: suggestedPlaces,
        budget_category: plan.budgetProfile.budgetCategory,
      },
    };
  },
};
