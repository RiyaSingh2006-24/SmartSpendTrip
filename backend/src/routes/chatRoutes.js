import { Router } from "express";
import { sendChatMessage } from "../controllers/chatController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(sendChatMessage));

export default router;
