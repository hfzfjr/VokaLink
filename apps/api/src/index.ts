import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { initNightlyDriftCron } from "./services/drift-cron.js";

const PORT = parseInt(process.env["PORT"] || "3001", 10);
const app = createApp();

app.listen(PORT, () => {
  logger.info(`VokaLink API server listening on http://localhost:${PORT}`);
  // FR-008: Aktifkan cron evaluasi drift otomatis pukul 00:30 WIB
  initNightlyDriftCron();
});

