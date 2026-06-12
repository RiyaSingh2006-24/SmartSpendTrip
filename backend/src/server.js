import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.port, () => {
  logger.info(`SmartSpend Trip AI API listening on port ${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Update PORT in backend/.env or stop the other process.`,
    );
    process.exit(1);
  }

  logger.error("Server failed to start", error);
  process.exit(1);
});
