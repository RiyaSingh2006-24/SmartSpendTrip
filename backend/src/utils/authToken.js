import crypto from "crypto";
import { env } from "../config/env.js";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

const sign = (value) =>
  crypto.createHmac("sha256", env.authSecret).update(value).digest("base64url");

export const createAuthToken = (payload) => {
  const body = {
    sub: payload.id,
    email: payload.email,
    name: payload.name,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = toBase64Url(JSON.stringify(body));
  return `${encoded}.${sign(encoded)}`;
};

export const verifyAuthToken = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  if (signature.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    if (!payload?.sub || !payload?.email || !payload?.exp || payload.exp < Date.now()) {
      return null;
    }

    return {
      id: String(payload.sub),
      email: String(payload.email).toLowerCase(),
      name: String(payload.name || ""),
    };
  } catch {
    return null;
  }
};

export const createResetToken = () => crypto.randomBytes(32).toString("hex");
export const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
