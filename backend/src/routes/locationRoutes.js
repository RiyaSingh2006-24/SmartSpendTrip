import { Router } from "express";
import { searchLocation } from "../controllers/locationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/search", asyncHandler(searchLocation));

export default router;
