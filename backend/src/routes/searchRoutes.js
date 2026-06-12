import { Router } from "express";
import {
  clearSearchHistory,
  createSearch,
  getSearchHistory,
} from "../controllers/searchController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createSearch));
router.get("/history", asyncHandler(getSearchHistory));
router.delete("/history", asyncHandler(clearSearchHistory));

export default router;
