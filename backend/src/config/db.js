import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import { ApiError } from "../utils/errors.js";
import { env, getServiceEnvStatus } from "./env.js";

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(currentDir, "..", "..", "sql", "schema.sql");
let schemaReady = false;

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
});

const extractErrorCode = (error) => {
  if (!error) {
    return "";
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code.trim();
  }

  if (typeof error.cause?.code === "string" && error.cause.code.trim()) {
    return error.cause.code.trim();
  }

  if (Array.isArray(error.errors)) {
    for (const nested of error.errors) {
      const code = extractErrorCode(nested);
      if (code) {
        return code;
      }
    }
  }

  return "";
};

const normalizeDatabaseError = (error) => {
  const message = error?.message?.trim();
  if (message) {
    return message;
  }

  const code = extractErrorCode(error);
  if (code) {
    return `PostgreSQL connection failed (${code}).`;
  }

  return "PostgreSQL connection failed.";
};

const readSchemaSql = () => fs.readFileSync(schemaPath, "utf8");

export const getStorageStatus = async () => {
  if (!env.databaseUrl) {
    return {
      mode: "local",
      fallback: true,
      reason: "not_configured",
      message: "DATABASE_URL is not configured. Using local JSON storage instead.",
    };
  }

  if (schemaReady) {
    return {
      mode: "database",
      fallback: false,
      reason: "ready",
      message: "Database connection is ready.",
    };
  }

  try {
    await pool.query(readSchemaSql());
    schemaReady = true;

    return {
      mode: "database",
      fallback: false,
      reason: "ready",
      message: "Database connection is ready.",
    };
  } catch (error) {
    return {
      mode: "local",
      fallback: true,
      reason: "unavailable",
      message: `PostgreSQL is not reachable. Using local JSON storage instead. ${normalizeDatabaseError(error)}`,
    };
  }
};

export const query = async (text, params = []) => {
  const storage = await getStorageStatus();
  if (storage.mode !== "database") {
    throw new ApiError(503, storage.message);
  }

  return pool.query(text, params);
};

export const checkDatabaseHealth = async () => {
  const databaseConfig = getServiceEnvStatus("databaseUrl");
  const storage = databaseConfig?.needsRestart
    ? {
        mode: "local",
        fallback: true,
        reason: "restart_required",
        message:
          "DATABASE_URL was added to backend/.env, but the backend server needs a restart. Using local JSON storage until then.",
      }
    : await getStorageStatus();

  return {
    ...databaseConfig,
    ok: storage.mode === "database",
    fallback: storage.fallback,
    storageMode: storage.mode,
    message: storage.message,
  };
};

export const withTransaction = async (work) => {
  const storage = await getStorageStatus();
  if (storage.mode !== "database") {
    throw new ApiError(503, storage.message);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
