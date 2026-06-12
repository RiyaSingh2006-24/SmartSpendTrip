import { z } from "zod";
import { budgetService } from "../services/budgetService.js";
import { foursquareService } from "../services/foursquareService.js";
import { weatherService } from "../services/weatherService.js";

const querySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  budget: z.coerce.number().positive().optional(),
  currency: z.string().max(3).default("USD"),
  budgetCategory: z.enum(["low", "mid", "luxury"]).optional(),
});

export const getNearbyPlaces = async (req, res) => {
  const query = querySchema.parse(req.query);
  const budgetProfile = query.budgetCategory
    ? { budgetCategory: query.budgetCategory }
    : budgetService.buildBudgetProfile({
        budget: query.budget || 120,
        currency: query.currency,
        travelers: 1,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      });

  const [nearby, weather] = await Promise.all([
    foursquareService.getNearbySpots({
      latitude: query.latitude,
      longitude: query.longitude,
      budgetCategory: budgetProfile.budgetCategory,
    }),
    weatherService.getWeatherSummary(query.latitude, query.longitude),
  ]);

  res.json({
    success: true,
    budget_category: budgetProfile.budgetCategory,
    weather,
    nearby,
  });
};
