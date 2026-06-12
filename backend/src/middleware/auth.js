import { verifyAuthToken } from "../utils/authToken.js";
import { ApiError } from "../utils/errors.js";

const extractToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
};

export const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  const user = verifyAuthToken(token);
  req.authUser = user;
  next();
};

export const requireAuth = (req, _res, next) => {
  const token = extractToken(req);
  const user = verifyAuthToken(token);

  if (!user) {
    next(new ApiError(401, "Authentication is required."));
    return;
  }

  req.authUser = user;
  next();
};
