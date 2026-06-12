import { Router } from "express";
import { getPlacesPreview } from "../controllers/placeController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getPlacesPreview));

export default router;
