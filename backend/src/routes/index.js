import { Router } from "express";
import itineraryRoutes from "./itineraryRoutes.js";
import chatRoutes from "./chatRoutes.js";
import placeRoutes from "./placeRoutes.js";
import nearbyRoutes from "./nearbyRoutes.js";
import locationRoutes from "./locationRoutes.js";
import searchRoutes from "./searchRoutes.js";
import authRoutes from "./authRoutes.js";
import { checkDatabaseHealth } from "../config/db.js";
import { checkMongoHealth } from "../config/mongo.js";
import { env, getServiceEnvStatus } from "../config/env.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.use(optionalAuth);

const formatMissingServiceWarning = (service) => {
  if (!service) {
    return "A required service is not configured.";
  }

  if (service.needsRestart) {
    return `${service.label} was added to backend/.env, but the backend server needs a restart to load ${service.envVar}.`;
  }

  if (service.configuredInExampleOnly) {
    return `${service.label} appears to be set in backend/.env.example only. Move ${service.envVar} to backend/.env.`;
  }

  return `${service.label} is not configured. Add ${service.envVar} to backend/.env.`;
};

router.get("/health", async (_req, res) => {
  const database = await checkDatabaseHealth();
  const mongo = await checkMongoHealth();
  const openai = getServiceEnvStatus("openAiApiKey");
  const foursquare = getServiceEnvStatus("foursquareApiKey");
  const openweather = getServiceEnvStatus("openWeatherApiKey");
  const location = {
    label: "Nominatim",
    envVar: "No API key required",
    configured: true,
    ok: true,
    fallback: env.demoMode,
    message: env.demoMode
      ? "OpenStreetMap geocoding is enabled with demo fallback support."
      : "OpenStreetMap geocoding is enabled.",
  };

  const services = {
    database,
    mongo,
    openai,
    location,
    foursquare,
    openweather,
  };

  const warnings = Object.values(services)
    .filter((service) => service && !service.fallback && (!service.configured || service.ok === false))
    .map((service) =>
      service.ok === false && service.configured
        ? `${service.label} is configured but not reachable.`
        : formatMissingServiceWarning(service),
    );

  res.json({
    success: true,
    service: "SmartSpend Trip AI API",
    timestamp: new Date().toISOString(),
    services,
    warnings,
  });
});

router.use("/auth", authRoutes);
router.use("/generate-itinerary", itineraryRoutes);
router.use("/chat", chatRoutes);
router.use("/places", placeRoutes);
router.use("/nearby", nearbyRoutes);
router.use("/location", locationRoutes);
router.use("/search", searchRoutes);

export default router;
