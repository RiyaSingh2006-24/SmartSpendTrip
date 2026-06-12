import { z } from "zod";
import { travelIntelligenceService } from "../services/travelIntelligenceService.js";

const querySchema = z.object({
  destination: z.string().min(2),
  budget: z.coerce.number().positive(),
  currency: z.string().max(3).default("USD"),
  travelers: z.coerce.number().int().min(1).max(20).default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tripType: z.string().default("Leisure"),
  countryCode: z.string().max(3).optional(),
  preferences: z.union([z.string(), z.array(z.string())]).optional(),
});

const normalizePreferences = (preferences) => {
  if (Array.isArray(preferences)) {
    return preferences.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  }
  if (typeof preferences === "string") {
    return preferences.split(",").map((value) => value.trim()).filter(Boolean);
  }
  return [];
};

export const getPlacesPreview = async (req, res) => {
  const parsed = querySchema.parse(req.query);
  const today = new Date();
  const fallbackStartDate = today.toISOString().slice(0, 10);
  const fallbackEndDate = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);

  const preview = await travelIntelligenceService.buildDestinationPreview({
    destination: parsed.destination,
    budget: parsed.budget,
    currency: parsed.currency,
    travelers: parsed.travelers,
    startDate: parsed.startDate || fallbackStartDate,
    endDate: parsed.endDate || fallbackEndDate,
    tripType: parsed.tripType,
    countryCode: parsed.countryCode,
    preferences: normalizePreferences(parsed.preferences),
  });

  res.json({
    success: true,
    ...preview,
  });
};
