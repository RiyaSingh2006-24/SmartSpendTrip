import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..", "..");
const dataDir = path.join(backendRoot, ".local-data");
const storagePath = path.join(dataDir, "store.json");

const createDefaultState = () => ({
  counters: {
    users: 1,
    trips: 1,
    itineraries: 1,
    recommendations: 1,
    chatMessages: 1,
    searchHistory: 1,
  },
  users: [],
  trips: [],
  itineraries: [],
  recommendations: [],
  chatMessages: [],
  searchHistory: [],
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

const ensureStorageFile = () => {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify(createDefaultState(), null, 2));
  }
};

const readState = () => {
  ensureStorageFile();

  try {
    const parsed = JSON.parse(fs.readFileSync(storagePath, "utf8"));
    const defaults = createDefaultState();

    return {
      ...defaults,
      ...parsed,
      counters: {
        ...defaults.counters,
        ...(parsed.counters || {}),
      },
      users: Array.isArray(parsed.users) ? parsed.users : [],
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
      itineraries: Array.isArray(parsed.itineraries) ? parsed.itineraries : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
      searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : [],
    };
  } catch {
    const fallback = createDefaultState();
    fs.writeFileSync(storagePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
};

const writeState = (state) => {
  ensureStorageFile();
  fs.writeFileSync(storagePath, JSON.stringify(state, null, 2));
};

const updateState = (mutate) => {
  const state = readState();
  const result = mutate(state);
  writeState(state);
  return clone(result);
};

const nextId = (state, key) => {
  const value = Number(state.counters[key] || 1);
  state.counters[key] = value + 1;
  return value;
};

export const localStore = {
  get storagePath() {
    return storagePath;
  },

  async upsertUser({ name, email, passwordHash = null }) {
    const normalizedEmail = email.toLowerCase();

    return updateState((state) => {
      const existing = state.users.find((user) => user.email === normalizedEmail);
      if (existing) {
        existing.name = name;
        if (passwordHash) {
          existing.password = passwordHash;
        }
        return existing;
      }

      const user = {
        id: nextId(state, "users"),
        name,
        email: normalizedEmail,
        password: passwordHash,
        created_at: now(),
      };
      state.users.push(user);
      return user;
    });
  },

  async findUserByEmail(email) {
    const state = readState();
    const normalizedEmail = String(email || "").toLowerCase();
    return clone(state.users.find((user) => user.email === normalizedEmail) || null);
  },

  async createTrip(payload) {
    return updateState((state) => {
      const trip = {
        id: nextId(state, "trips"),
        user_id: payload.userId,
        destination: payload.destination,
        budget: payload.budget,
        preferences: payload.preferences,
        dates: payload.dates,
        created_at: now(),
      };
      state.trips.push(trip);
      return trip;
    });
  },

  async findTripById(tripId) {
    const state = readState();
    return clone(state.trips.find((trip) => Number(trip.id) === Number(tripId)) || null);
  },

  async createItineraryRows(tripId, itineraryDays) {
    return updateState((state) =>
      itineraryDays.map((day) => {
        const row = {
          id: nextId(state, "itineraries"),
          trip_id: tripId,
          day_number: day.day_number,
          activities: day.activities,
          cost: day.cost,
          created_at: now(),
        };
        state.itineraries.push(row);
        return row;
      }),
    );
  },

  async findItineraryByTripId(tripId) {
    const state = readState();
    return clone(
      state.itineraries
        .filter((item) => Number(item.trip_id) === Number(tripId))
        .sort((left, right) => left.day_number - right.day_number),
    );
  },

  async createRecommendation(payload) {
    return updateState((state) => {
      const recommendation = {
        id: nextId(state, "recommendations"),
        trip_id: payload.tripId,
        state: payload.state,
        suggested_places: payload.suggestedPlaces,
        budget_category: payload.budgetCategory,
        created_at: now(),
      };
      state.recommendations.push(recommendation);
      return recommendation;
    });
  },

  async findRecommendationByTripId(tripId) {
    const state = readState();
    const matches = state.recommendations
      .filter((item) => Number(item.trip_id) === Number(tripId))
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

    return clone(matches[0] || null);
  },

  async createChatMessage(payload) {
    return updateState((state) => {
      const chatMessage = {
        id: nextId(state, "chatMessages"),
        user_id: payload.userId,
        message: payload.message,
        response: payload.response,
        trip_id: payload.tripId || null,
        search_history_id: payload.searchHistoryId || null,
        timestamp: now(),
      };
      state.chatMessages.push(chatMessage);
      return chatMessage;
    });
  },

  async findRecentChatMessagesByUser(userId, limit) {
    const state = readState();
    return clone(
      state.chatMessages
        .filter((item) => Number(item.user_id) === Number(userId))
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        .slice(0, limit),
    );
  },

  async createSearchHistory(payload) {
    return updateState((state) => {
      const historyEntry = {
        id: nextId(state, "searchHistory"),
        user_id: payload.userId,
        search_query: payload.searchQuery,
        timestamp: now(),
        location_data: payload.locationData,
      };
      state.searchHistory.push(historyEntry);
      return historyEntry;
    });
  },

  async findSearchHistoryById(searchId) {
    const state = readState();
    return clone(state.searchHistory.find((item) => Number(item.id) === Number(searchId)) || null);
  },

  async findRecentSearchHistoryByUser(userId, limit) {
    const state = readState();
    return clone(
      state.searchHistory
        .filter((item) => Number(item.user_id) === Number(userId))
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        .slice(0, limit),
    );
  },

  async clearSearchHistoryByUser(userId) {
    return updateState((state) => {
      const before = state.searchHistory.length;
      state.searchHistory = state.searchHistory.filter(
        (item) => Number(item.user_id) !== Number(userId),
      );
      return before - state.searchHistory.length;
    });
  },
};
