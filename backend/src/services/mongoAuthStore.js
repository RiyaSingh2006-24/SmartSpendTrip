import { ObjectId } from "mongodb";
import { getMongoCollection } from "../config/mongo.js";

const usersCollection = () => getMongoCollection("auth_users");

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash || null,
    resetTokenHash: user.resetTokenHash || null,
    resetTokenExpiresAt: user.resetTokenExpiresAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const mongoAuthStore = {
  async findByEmail(email) {
    const collection = await usersCollection();
    const user = await collection.findOne({ email: String(email || "").toLowerCase() });
    return normalizeUser(user);
  },

  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await usersCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    return normalizeUser(user);
  },

  async createUser({ name, email, passwordHash }) {
    const collection = await usersCollection();
    const now = new Date().toISOString();
    const document = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: now,
      updatedAt: now,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    };

    const result = await collection.insertOne(document);
    return normalizeUser({ ...document, _id: result.insertedId });
  },

  async updatePassword(userId, passwordHash) {
    const collection = await usersCollection();
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordHash,
          updatedAt: new Date().toISOString(),
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      },
    );
  },

  async saveResetToken(userId, resetTokenHash, resetTokenExpiresAt) {
    const collection = await usersCollection();
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          resetTokenHash,
          resetTokenExpiresAt,
          updatedAt: new Date().toISOString(),
        },
      },
    );
  },

  async findByResetTokenHash(resetTokenHash) {
    const collection = await usersCollection();
    const user = await collection.findOne({ resetTokenHash });
    return normalizeUser(user);
  },
};
