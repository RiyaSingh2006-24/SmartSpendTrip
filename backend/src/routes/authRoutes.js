import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  resetPassword,
  signup,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.get("/me", requireAuth, asyncHandler(getCurrentUser));

export default router;
