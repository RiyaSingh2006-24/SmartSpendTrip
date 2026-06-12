import { z } from "zod";
import { authService } from "../services/authService.js";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const signup = async (req, res) => {
  const payload = signupSchema.parse(req.body);
  const result = await authService.signup(payload);
  res.status(201).json({ success: true, ...result });
};

export const login = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const result = await authService.login(payload);
  res.json({ success: true, ...result });
};

export const getCurrentUser = async (req, res) => {
  const user = await authService.getUserFromTokenPayload(req.authUser);
  res.json({ success: true, user });
};

export const forgotPassword = async (req, res) => {
  const payload = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(payload.email);
  res.json(result);
};

export const resetPassword = async (req, res) => {
  const payload = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(payload);
  res.json({ success: true, ...result });
};
