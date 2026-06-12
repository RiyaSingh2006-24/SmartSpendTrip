import { Router } from "express";
import { generateItinerary } from "../controllers/itineraryController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(generateItinerary));

export default router;
