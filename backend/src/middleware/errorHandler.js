import { logger } from "../config/logger.js";

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);

  logger.error(req.method, req.originalUrl, error);

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    details: error.details,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};
