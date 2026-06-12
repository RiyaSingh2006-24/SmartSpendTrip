import { z } from "zod";
import { persistenceService } from "../services/persistenceService.js";
import { travelIntelligenceService } from "../services/travelIntelligenceService.js";

const normalizeDateRange = (payload) => {
  const today = new Date();
  const fallbackStartDate = today.toISOString().slice(0, 10);
  const fallbackEndDate = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);

  return {
    ...payload,
    startDate: payload.startDate || fallbackStartDate,
    endDate: payload.endDate || fallbackEndDate,
  };
};

const isValidDateString = (value) => !Number.isNaN(new Date(value).getTime());

const searchBodySchema = z
  .object({
    user: z.object({
      name: z.string().min(2),
      email: z.string().email(),
    }),
    destination: z.string().min(2),
    budget: z.coerce.number().positive(),
    currency: z.string().max(3).default("USD"),
    travelers: z.coerce.number().int().min(1).max(20).default(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tripType: z.string().default("Leisure"),
    countryCode: z.string().max(3).optional(),
    preferences: z.array(z.string()).default([]),
  })
  .superRefine((payload, ctx) => {
    if (payload.startDate && !isValidDateString(payload.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date must be a valid ISO date.",
      });
    }

    if (payload.endDate && !isValidDateString(payload.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be a valid ISO date.",
      });
    }

    if (payload.startDate && payload.endDate) {
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      if (start.getTime() > end.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be on or after the start date.",
        });
      }
    }
  });

const historyQuerySchema = z.object({
  email: z.string().email(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const clearHistorySchema = z.object({
  email: z.string().email(),
});

export const createSearch = async (req, res) => {
  const parsed = normalizeDateRange(searchBodySchema.parse(req.body));
  const preview = await travelIntelligenceService.buildDestinationPreview(parsed);
  const persisted = await persistenceService.saveSearch(parsed, preview, req.authUser);

  res.status(201).json({
    success: true,
    search_id: persisted.search.id,
    storage_mode: persisted.storageMode,
    ...preview,
  });
};

export const getSearchHistory = async (req, res) => {
  const query = historyQuerySchema.parse(req.query);
  const history = await persistenceService.getSearchHistory(query, req.authUser);

  res.json({
    success: true,
    storage_mode: history.storageMode,
    history: history.history,
  });
};

export const clearSearchHistory = async (req, res) => {
  const payload = clearHistorySchema.parse(req.body);
  const result = await persistenceService.clearSearchHistory(payload, req.authUser);

  res.json({
    success: true,
    cleared: result.cleared,
    storage_mode: result.storageMode,
  });
};
