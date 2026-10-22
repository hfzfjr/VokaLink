import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../lib/logger.js";
import { evaluateDriftForAllPlacements } from "./drift-evaluator.js";

/**
 * FR-008: Nightly Drift Evaluation Cron Job (DESIGN.md §8.3 & SPRINT Hari 6)
 * Jadwal: 00:30 WIB setiap malam ('30 0 * * *' zona waktu Asia/Jakarta)
 */
export function initNightlyDriftCron(): ScheduledTask | null {
  if (process.env["NODE_ENV"] === "test" || Boolean(process.env["VITEST"])) {
    return null;
  }

  // Menjalankan evaluasi otomatis tiap pukul 00:30 WIB
  const task = cron.schedule(
    "30 0 * * *",
    async () => {
      logger.info("[CRON] Menjalankan evaluasi drift otomatis tengah malam (00:30 WIB)...");
      try {
        const result = await evaluateDriftForAllPlacements();
        logger.info(
          `[CRON] Evaluasi drift selesai: ${result.evaluatedCount} penempatan dievaluasi, ${result.activeAlertsCreatedOrUpdated} anomali aktif diperbarui.`
        );
      } catch (err) {
        logger.error({ err }, "[CRON] Gagal mengeksekusi evaluasi drift otomatis.");
      }
    },
    {
      timezone: "Asia/Jakarta",
    }
  );

  logger.info("🕒 [CRON] Nightly Drift Evaluator aktif (terjadwal 00:30 WIB Asia/Jakarta).");
  return task;
}
