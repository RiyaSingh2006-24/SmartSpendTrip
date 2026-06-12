import { pool, getStorageStatus, withTransaction } from "../config/db.js";
import { chatMessageModel } from "../models/chatMessageModel.js";
import { itineraryModel } from "../models/itineraryModel.js";
import { recommendationModel } from "../models/recommendationModel.js";
import { searchHistoryModel } from "../models/searchHistoryModel.js";
import { tripModel } from "../models/tripModel.js";
import { userModel } from "../models/userModel.js";
import { ApiError } from "../utils/errors.js";
import { localStore } from "./localStore.js";
import { mongoSearchStore } from "./mongoSearchStore.js";

const SEARCH_HISTORY_LIMIT = 12;
const CHAT_HISTORY_LIMIT = 6;
const CHAT_SEARCH_LIMIT = 5;

const buildTripPayload = (request) => ({
  destination: request.destination,
  budget: request.budget,
  preferences: {
    currency: request.currency,
    travelers: request.travelers,
    tripType: request.tripType,
    accommodationType: request.accommodationType,
    transportMode: request.transportMode,
    pace: request.pace,
    preferences: request.preferences,
    foodPreferences: request.foodPreferences,
    notes: request.notes,
  },
  dates: {
    startDate: request.startDate,
    endDate: request.endDate,
  },
});

const buildRecommendationPayload = (responsePayload) => ({
  state: responsePayload.storage_payload.state,
  suggestedPlaces: responsePayload.storage_payload.suggested_places,
  budgetCategory: responsePayload.storage_payload.budget_category,
});

const buildDefaultTripContext = (payload) => ({
  destination: payload.destination,
  budget: payload.budget,
  currency: payload.currency,
});

const buildSearchLocationData = (payload, previewPayload) => ({
  query: {
    destination: payload.destination,
    countryCode: payload.countryCode || "",
    budget: payload.budget,
    currency: payload.currency,
    travelers: payload.travelers,
    startDate: payload.startDate,
    endDate: payload.endDate,
    tripType: payload.tripType,
    preferences: payload.preferences || [],
  },
  preview: previewPayload,
});

const normalizeSearchHistoryEntry = (entry) => ({
  id: entry.id,
  user_id: entry.user_id,
  search_query: entry.search_query,
  timestamp: entry.timestamp,
  location_data: entry.location_data,
});

const ensureSearchBelongsToUser = (searchEntry, userId, searchId) => {
  if (!searchEntry) {
    throw new ApiError(404, `Search ${searchId} was not found`);
  }

  if (Number(searchEntry.user_id) !== Number(userId)) {
    throw new ApiError(403, "You do not have access to this search history entry.");
  }

  return searchEntry;
};

const isMongoAuthAvailable = (authUser) => Boolean(authUser?.id);

export const persistenceService = {
  async persistTripPlan(payload, responsePayload) {
    const storage = await getStorageStatus();

    if (storage.mode === "database") {
      const persisted = await withTransaction(async (executor) => {
        const user = await userModel.upsert(payload.user, executor);
        const trip = await tripModel.create(
          {
            userId: user.id,
            ...buildTripPayload(payload),
          },
          executor,
        );

        const itineraryRows = responsePayload.itinerary.length
          ? await itineraryModel.createMany(
              trip.id,
              responsePayload.itinerary.map((day) => ({
                day_number: day.day_number,
                activities: day.activities,
                cost: day.cost,
              })),
              executor,
            )
          : [];

        const recommendation = await recommendationModel.create(
          {
            tripId: trip.id,
            ...buildRecommendationPayload(responsePayload),
          },
          executor,
        );

        return { user, trip, itineraryRows, recommendation };
      });

      return { ...persisted, storageMode: storage.mode };
    }

    const user = await localStore.upsertUser(payload.user);
    const trip = await localStore.createTrip({
      userId: user.id,
      ...buildTripPayload(payload),
    });
    const itineraryRows = responsePayload.itinerary.length
      ? await localStore.createItineraryRows(
          trip.id,
          responsePayload.itinerary.map((day) => ({
            day_number: day.day_number,
            activities: day.activities,
            cost: day.cost,
          })),
        )
      : [];
    const recommendation = await localStore.createRecommendation({
      tripId: trip.id,
      ...buildRecommendationPayload(responsePayload),
    });

    return { user, trip, itineraryRows, recommendation, storageMode: storage.mode };
  },

  async saveSearch(payload, previewPayload, authUser = null) {
    const locationData = buildSearchLocationData(payload, previewPayload);

    if (isMongoAuthAvailable(authUser)) {
      const search = await mongoSearchStore.createSearchHistory({
        userId: authUser.id,
        email: authUser.email,
        searchQuery: payload.destination,
        locationData,
      });

      return {
        user: {
          id: authUser.id,
          name: authUser.name || payload.user.name,
          email: authUser.email,
        },
        search,
        storageMode: "mongo",
      };
    }

    const storage = await getStorageStatus();

    if (storage.mode === "database") {
      const persisted = await withTransaction(async (executor) => {
        const user = await userModel.upsert(payload.user, executor);
        const search = await searchHistoryModel.create(
          {
            userId: user.id,
            searchQuery: payload.destination,
            locationData,
          },
          executor,
        );

        return { user, search };
      });

      return {
        ...persisted,
        search: normalizeSearchHistoryEntry(persisted.search),
        storageMode: storage.mode,
      };
    }

    const user = await localStore.upsertUser(payload.user);
    const search = await localStore.createSearchHistory({
      userId: user.id,
      searchQuery: payload.destination,
      locationData,
    });

    return {
      user,
      search: normalizeSearchHistoryEntry(search),
      storageMode: storage.mode,
    };
  },

  async getSearchHistory({ email, limit = SEARCH_HISTORY_LIMIT }, authUser = null) {
    if (isMongoAuthAvailable(authUser)) {
      const history = await mongoSearchStore.findRecentSearchHistoryByUser(authUser.id, limit);
      return { history, storageMode: "mongo" };
    }

    const storage = await getStorageStatus();

    if (storage.mode === "database") {
      const user = await userModel.findByEmail(email, pool);
      if (!user) {
        return { history: [], storageMode: storage.mode };
      }

      const history = await searchHistoryModel.findRecentByUser(user.id, limit, pool);
      return {
        history: history.map(normalizeSearchHistoryEntry),
        storageMode: storage.mode,
      };
    }

    const user = await localStore.findUserByEmail(email);
    if (!user) {
      return { history: [], storageMode: storage.mode };
    }

    const history = await localStore.findRecentSearchHistoryByUser(user.id, limit);
    return {
      history: history.map(normalizeSearchHistoryEntry),
      storageMode: storage.mode,
    };
  },

  async clearSearchHistory({ email }, authUser = null) {
    if (isMongoAuthAvailable(authUser)) {
      const cleared = await mongoSearchStore.clearSearchHistoryByUser(authUser.id);
      return { cleared, storageMode: "mongo" };
    }

    const storage = await getStorageStatus();

    if (storage.mode === "database") {
      const user = await userModel.findByEmail(email, pool);
      if (!user) {
        return { cleared: 0, storageMode: storage.mode };
      }

      const cleared = await withTransaction((executor) =>
        searchHistoryModel.clearByUser(user.id, executor),
      );

      return { cleared, storageMode: storage.mode };
    }

    const user = await localStore.findUserByEmail(email);
    if (!user) {
      return { cleared: 0, storageMode: storage.mode };
    }

    const cleared = await localStore.clearSearchHistoryByUser(user.id);
    return { cleared, storageMode: storage.mode };
  },

  async prepareChatContext(payload, authUser = null) {
    if (isMongoAuthAvailable(authUser)) {
      const storage = await getStorageStatus();
      const user =
        storage.mode === "database"
          ? await withTransaction((executor) =>
              userModel.upsert(
                {
                  name: authUser.name || payload.user.name,
                  email: authUser.email,
                },
                executor,
              ),
            )
          : await localStore.upsertUser({
              name: authUser.name || payload.user.name,
              email: authUser.email,
            });
      const [recentSearches, recentMessages] = await Promise.all([
        mongoSearchStore.findRecentSearchHistoryByUser(authUser.id, CHAT_SEARCH_LIMIT),
        storage.mode === "database"
          ? chatMessageModel.findRecentByUser(user.id, CHAT_HISTORY_LIMIT, pool)
          : localStore.findRecentChatMessagesByUser(user.id, CHAT_HISTORY_LIMIT),
      ]);

      let tripContext = buildDefaultTripContext(payload);
      if (payload.tripId) {
        if (storage.mode === "database") {
          const [trip, itinerary, recommendation] = await Promise.all([
            tripModel.findById(payload.tripId, pool),
            itineraryModel.findByTripId(payload.tripId, pool),
            recommendationModel.findByTripId(payload.tripId, pool),
          ]);

          if (!trip) {
            throw new ApiError(404, `Trip ${payload.tripId} was not found`);
          }

          tripContext = { trip, itinerary, recommendation };
        } else {
          const trip = await localStore.findTripById(payload.tripId);
          if (!trip) {
            throw new ApiError(404, `Trip ${payload.tripId} was not found`);
          }

          const [itinerary, recommendation] = await Promise.all([
            localStore.findItineraryByTripId(payload.tripId),
            localStore.findRecommendationByTripId(payload.tripId),
          ]);

          tripContext = { trip, itinerary, recommendation };
        }
      }

      const activeSearch = payload.searchId
        ? ensureSearchBelongsToUser(
            await mongoSearchStore.findSearchHistoryById(String(payload.searchId)),
            authUser.id,
            payload.searchId,
          )
        : recentSearches[0] || null;

      return {
        user,
        recentMessages,
        recentSearches: recentSearches.map(normalizeSearchHistoryEntry),
        activeSearch: activeSearch ? normalizeSearchHistoryEntry(activeSearch) : null,
        tripContext,
        storageMode: storage.mode,
      };
    }

    const storage = await getStorageStatus();

    if (storage.mode === "database") {
      const user = await withTransaction((executor) => userModel.upsert(payload.user, executor));
      const [recentMessages, recentSearches] = await Promise.all([
        chatMessageModel.findRecentByUser(user.id, CHAT_HISTORY_LIMIT, pool),
        searchHistoryModel.findRecentByUser(user.id, CHAT_SEARCH_LIMIT, pool),
      ]);

      let tripContext = buildDefaultTripContext(payload);
      if (payload.tripId) {
        const [trip, itinerary, recommendation] = await Promise.all([
          tripModel.findById(payload.tripId, pool),
          itineraryModel.findByTripId(payload.tripId, pool),
          recommendationModel.findByTripId(payload.tripId, pool),
        ]);

        if (!trip) {
          throw new ApiError(404, `Trip ${payload.tripId} was not found`);
        }

        tripContext = {
          trip,
          itinerary,
          recommendation,
        };
      }

      const activeSearch = payload.searchId
        ? ensureSearchBelongsToUser(
            await searchHistoryModel.findById(payload.searchId, pool),
            user.id,
            payload.searchId,
          )
        : recentSearches[0] || null;

      return {
        user,
        recentMessages,
        recentSearches: recentSearches.map(normalizeSearchHistoryEntry),
        activeSearch: activeSearch ? normalizeSearchHistoryEntry(activeSearch) : null,
        tripContext,
        storageMode: storage.mode,
      };
    }

    const user = await localStore.upsertUser(payload.user);
    const [recentMessages, recentSearches] = await Promise.all([
      localStore.findRecentChatMessagesByUser(user.id, CHAT_HISTORY_LIMIT),
      localStore.findRecentSearchHistoryByUser(user.id, CHAT_SEARCH_LIMIT),
    ]);

    let tripContext = buildDefaultTripContext(payload);
    if (payload.tripId) {
      const trip = await localStore.findTripById(payload.tripId);
      if (!trip) {
        throw new ApiError(404, `Trip ${payload.tripId} was not found`);
      }

      const [itinerary, recommendation] = await Promise.all([
        localStore.findItineraryByTripId(payload.tripId),
        localStore.findRecommendationByTripId(payload.tripId),
      ]);

      tripContext = {
        trip,
        itinerary,
        recommendation,
      };
    }

    const rawActiveSearch = payload.searchId
      ? ensureSearchBelongsToUser(
          await localStore.findSearchHistoryById(payload.searchId),
          user.id,
          payload.searchId,
        )
      : recentSearches[0] || null;

    return {
      user,
      recentMessages,
      recentSearches: recentSearches.map(normalizeSearchHistoryEntry),
      activeSearch: rawActiveSearch ? normalizeSearchHistoryEntry(rawActiveSearch) : null,
      tripContext,
      storageMode: storage.mode,
    };
  },

  async saveChatMessage(payload, storageMode) {
    if (storageMode === "database") {
      const normalizedSearchHistoryId =
        payload.searchHistoryId && /^\d+$/.test(String(payload.searchHistoryId))
          ? Number(payload.searchHistoryId)
          : null;

      return withTransaction((executor) =>
        chatMessageModel.create(
          {
            ...payload,
            searchHistoryId: normalizedSearchHistoryId,
          },
          executor,
        ),
      );
    }

    return localStore.createChatMessage(payload);
  },
};
