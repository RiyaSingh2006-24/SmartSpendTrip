import { z } from "zod";
import { persistenceService } from "../services/persistenceService.js";
import { travelIntelligenceService } from "../services/travelIntelligenceService.js";

const requestSchema = z.object({
  user: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
  destination: z.string().min(2),
  budget: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).default("USD"),
  travelers: z.coerce.number().int().min(1).max(20).default(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  tripType: z.string().min(2),
  accommodationType: z.string().min(2),
  transportMode: z.string().min(2),
  countryCode: z.string().max(3).optional(),
  pace: z.coerce.number().min(0).max(100).default(50),
  preferences: z.array(z.string()).default([]),
  foodPreferences: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const generateItinerary = async (req, res) => {
  const payload = requestSchema.parse(req.body);
  const plan = await travelIntelligenceService.buildTripPlan(payload);
  const responsePayload = travelIntelligenceService.buildApiResponse(plan);
  const persisted = await persistenceService.persistTripPlan(payload, responsePayload);

  res.status(201).json({
    success: true,
    trip_id: persisted.trip.id,
    user_id: persisted.user.id,
    storage_mode: persisted.storageMode,
    ...responsePayload,
  });
};
