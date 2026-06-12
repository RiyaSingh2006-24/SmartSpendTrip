import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..", "..");
const runtimeEnvPaths = [".env", ".env.local"].map((fileName) => path.join(backendRoot, fileName));
const exampleEnvPath = path.join(backendRoot, ".env.example");

const hasValue = (value) => (typeof value === "string" ? value.trim().length > 0 : Boolean(value));

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return dotenv.parse(fs.readFileSync(filePath));
  } catch {
    return {};
  }
};

const loadedEnvFiles = runtimeEnvPaths.reduce((files, envPath) => {
  if (!fs.existsSync(envPath)) {
    return files;
  }

  const result = dotenv.config({ path: envPath, override: false });
  if (!result.error) {
    files.push(path.relative(backendRoot, envPath) || path.basename(envPath));
  }

  return files;
}, []);

const readRuntimeEnvValues = () =>
  runtimeEnvPaths.reduce((merged, envPath) => ({ ...merged, ...parseEnvFile(envPath) }), {});

const readExampleEnvValues = () => parseEnvFile(exampleEnvPath);

const envDefinitions = {
  databaseUrl: {
    envVar: "DATABASE_URL",
    label: "PostgreSQL",
  },
  mongoUri: {
    envVar: "MONGO_URI",
    label: "MongoDB",
  },
  openAiApiKey: {
    envVar: "OPENAI_API_KEY",
    label: "OpenAI",
  },
  foursquareApiKey: {
    envVar: "FOURSQUARE_API_KEY",
    label: "Foursquare",
  },
  openWeatherApiKey: {
    envVar: "OPENWEATHER_API_KEY",
    label: "OpenWeather",
  },
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback = "") =>
  (value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || "development";
const authSecret = process.env.AUTH_SECRET || "smartspend-dev-secret";

if (nodeEnv === "production" && authSecret === "smartspend-dev-secret") {
  throw new Error("AUTH_SECRET must be configured in production.");
}

export const env = {
  nodeEnv,
  port: toNumber(process.env.PORT, 5000),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: process.env.DATABASE_SSL === "true",
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  authSecret,
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  corsOrigins: toList(
    process.env.CORS_ORIGIN,
    "http://localhost:5173,http://localhost:8080,http://localhost:8081",
  ),
  corsOriginPatterns: toList(process.env.CORS_ORIGIN_PATTERNS),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1",
  foursquareApiKey: process.env.FOURSQUARE_API_KEY || "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || "",
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || "",
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || "IN",
  demoMode: process.env.DEMO_MODE === "true",
};

export const getEnvDefinition = (key) => envDefinitions[key] || null;

export const getServiceEnvStatus = (key) => {
  const definition = getEnvDefinition(key);
  if (!definition) {
    return null;
  }

  const runtimeEnvValues = readRuntimeEnvValues();
  const exampleEnvValues = readExampleEnvValues();
  const configured = hasValue(process.env[definition.envVar]);
  const runtimeFileConfigured = hasValue(runtimeEnvValues[definition.envVar]);
  const exampleFileConfigured = hasValue(exampleEnvValues[definition.envVar]);

  return {
    key,
    label: definition.label,
    envVar: definition.envVar,
    configured,
    runtimeFileConfigured,
    exampleFileConfigured,
    configuredInExampleOnly: !configured && !runtimeFileConfigured && exampleFileConfigured,
    needsRestart: !configured && runtimeFileConfigured,
    loadedEnvFiles,
    fallback: env.demoMode && key !== "databaseUrl",
    message:
      env.demoMode && key !== "databaseUrl"
        ? `${definition.label} demo fallback is enabled for local submission mode.`
        : undefined,
  };
};

export const assertEnv = (...keys) => {
  const missing = keys
    .filter((key) => !env[key])
    .map((key) => getEnvDefinition(key)?.envVar || key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
