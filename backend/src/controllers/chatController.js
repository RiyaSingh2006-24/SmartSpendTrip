import { z } from "zod";
import { openaiService } from "../services/openaiService.js";
import { persistenceService } from "../services/persistenceService.js";

const requestSchema = z.object({
  user: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
  tripId: z.coerce.number().int().positive().optional(),
  searchId: z.union([z.string().min(1), z.coerce.number().int().positive()]).optional(),
  destination: z.string().optional(),
  budget: z.coerce.number().positive().optional(),
  currency: z.string().max(3).optional(),
  message: z.string().min(2),
});

export const sendChatMessage = async (req, res) => {
  const payload = requestSchema.parse(req.body);
  const context = await persistenceService.prepareChatContext(payload, req.authUser);

  const responseText = await openaiService.generateChatResponse({
    message: payload.message,
    tripContext: context.tripContext,
    recentMessages: context.recentMessages,
    activeSearch: context.activeSearch,
    recentSearches: context.recentSearches,
  });

  const chatMessage = await persistenceService.saveChatMessage(
    {
      userId: context.user.id,
      message: payload.message,
      response: responseText,
      tripId: payload.tripId,
      searchHistoryId: context.activeSearch?.id,
    },
    context.storageMode,
  );

  res.json({
    success: true,
    message_id: chatMessage.id,
    response: responseText,
    storage_mode: context.storageMode,
  });
};
