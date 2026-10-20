import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const PORT = parseInt(process.env["PORT"] || "3001", 10);
const app = createApp();

app.listen(PORT, () => {
  logger.info(`VokaLink API server listening on http://localhost:${PORT}`);
});
