import { ObjectId } from "mongodb";
import { getMongoCollection } from "../config/mongo.js";

const searchCollection = () => getMongoCollection("search_history");

const normalizeSearchEntry = (entry) => {
  if (!entry) {
    return null;
  }

  return {
    id: String(entry._id),
    user_id: String(entry.userId),
    search_query: entry.searchQuery,
    timestamp: entry.timestamp,
    location_data: entry.locationData,
  };
};

export const mongoSearchStore = {
  async createSearchHistory(payload) {
    const collection = await searchCollection();
    const document = {
      userId: String(payload.userId),
      email: String(payload.email || "").toLowerCase(),
      searchQuery: payload.searchQuery,
      locationData: payload.locationData,
      timestamp: new Date().toISOString(),
    };
    const result = await collection.insertOne(document);
    return normalizeSearchEntry({ ...document, _id: result.insertedId });
  },

  async findSearchHistoryById(searchId) {
    if (!ObjectId.isValid(searchId)) {
      return null;
    }

    const collection = await searchCollection();
    const entry = await collection.findOne({ _id: new ObjectId(searchId) });
    return normalizeSearchEntry(entry);
  },

  async findRecentSearchHistoryByUser(userId, limit) {
    const collection = await searchCollection();
    const entries = await collection
      .find({ userId: String(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return entries.map(normalizeSearchEntry);
  },

  async clearSearchHistoryByUser(userId) {
    const collection = await searchCollection();
    const result = await collection.deleteMany({ userId: String(userId) });
    return result.deletedCount || 0;
  },
};
