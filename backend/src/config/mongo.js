import { MongoClient, ServerApiVersion } from "mongodb";
import { env, getServiceEnvStatus } from "./env.js";
import { ApiError } from "../utils/errors.js";

let clientPromise = null;
let pingReady = false;

const createClient = () =>
  new MongoClient(env.mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

const getClient = async () => {
  if (!env.mongoUri) {
    throw new ApiError(
      503,
      "MongoDB auth storage is not configured. Add MONGO_URI to backend/.env, then restart the backend.",
    );
  }

  if (!clientPromise) {
    const client = createClient();
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

export const getMongoDb = async () => {
  const client = await getClient();
  return client.db();
};

export const getMongoCollection = async (name) => {
  const db = await getMongoDb();
  return db.collection(name);
};

export const checkMongoHealth = async () => {
  const mongoConfig = getServiceEnvStatus("mongoUri");

  if (!env.mongoUri) {
    return {
      ...mongoConfig,
      ok: false,
      storageMode: "disabled",
      message: "MongoDB is not configured.",
    };
  }

  if (pingReady) {
    return {
      ...mongoConfig,
      ok: true,
      storageMode: "mongo",
      message: "MongoDB connection is ready.",
    };
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    pingReady = true;

    return {
      ...mongoConfig,
      ok: true,
      storageMode: "mongo",
      message: "MongoDB connection is ready.",
    };
  } catch (error) {
    return {
      ...mongoConfig,
      ok: false,
      storageMode: "disabled",
      message: error?.message || "MongoDB is not reachable.",
    };
  }
};
