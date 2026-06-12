import { Router } from "express";
import { getNearbyPlaces } from "../controllers/nearbyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getNearbyPlaces));

export default router;
