import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { createAuthToken, createResetToken, hashResetToken } from "../utils/authToken.js";
import { mongoAuthStore } from "./mongoAuthStore.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

export const authService = {
  async signup({ name, email, password }) {
    const existing = await mongoAuthStore.findByEmail(email);
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await mongoAuthStore.createUser({ name, email, passwordHash });

    return {
      user: sanitizeUser(user),
      token: createAuthToken(user),
    };
  },

  async login({ email, password }) {
    const user = await mongoAuthStore.findByEmail(email);
    if (!user?.passwordHash) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    return {
      user: sanitizeUser(user),
      token: createAuthToken(user),
    };
  },

  async getUserFromTokenPayload(tokenUser) {
    if (!tokenUser?.id) {
      return null;
    }

    const user = await mongoAuthStore.findById(tokenUser.id);
    return user ? sanitizeUser(user) : null;
  },

  async forgotPassword(email) {
    const user = await mongoAuthStore.findByEmail(email);
    if (!user) {
      return {
        success: true,
        message: "If an account exists for this email, a reset link has been prepared.",
      };
    }

    const rawToken = createResetToken();
    const resetTokenHash = hashResetToken(rawToken);
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await mongoAuthStore.saveResetToken(user.id, resetTokenHash, resetTokenExpiresAt);

    const resetUrl = `${env.frontendBaseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    return {
      success: true,
      message: "Password reset link generated.",
      resetToken: env.nodeEnv === "production" ? undefined : rawToken,
      resetUrl: env.nodeEnv === "production" ? undefined : resetUrl,
    };
  },

  async resetPassword({ token, password }) {
    const resetTokenHash = hashResetToken(token);
    const user = await mongoAuthStore.findByResetTokenHash(resetTokenHash);

    if (!user || !user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
      throw new ApiError(400, "This password reset link is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await mongoAuthStore.updatePassword(user.id, passwordHash);

    const refreshedUser = await mongoAuthStore.findById(user.id);

    return {
      user: sanitizeUser(refreshedUser),
      token: createAuthToken(refreshedUser),
    };
  },
};
