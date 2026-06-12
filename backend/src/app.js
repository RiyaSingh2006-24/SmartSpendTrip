import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const isLocalDevelopmentOrigin = (origin) => {
  if (env.nodeEnv !== "development") {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return (
      (protocol === "http:" || protocol === "https:") &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")
    );
  } catch {
    return false;
  }
};

const wildcardPatternToRegExp = (pattern) =>
  new RegExp(`^${pattern.split("*").map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&")).join(".*")}$`);

const corsOriginPatterns = env.corsOriginPatterns.map(wildcardPatternToRegExp);

const isAllowedCorsOrigin = (origin) =>
  !origin ||
  env.corsOrigins.includes(origin) ||
  corsOriginPatterns.some((pattern) => pattern.test(origin)) ||
  isLocalDevelopmentOrigin(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
