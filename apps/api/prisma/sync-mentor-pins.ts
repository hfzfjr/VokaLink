import { PrismaClient } from "@prisma/client";
import { generateSalt, hashPinWithScrypt, hashSha256Hex } from "@vokalink/core/crypto";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const prisma = new PrismaClient();
const PIN_PEPPER =
  process.env.PIN_PEPPER ||
  "2368e2efd2c3f72399a155b368dfaa0377122fc6d41afd66c2215d717f8543f4";

async function main() {
  console.log("🔄 Sinkronisasi PIN Default Mentor (1234) untuk Semua DUDI...");
  const mentors = await prisma.dudiMentor.findMany({
    include: { dudiPartner: true },
  });

  console.log(`Ditemukan ${mentors.length} mentor di database.`);

  for (let i = 0; i < mentors.length; i++) {
    const mentor = mentors[i]!;
    const salt = generateSalt(16);
    const defaultPinHash = hashPinWithScrypt("1234", salt, PIN_PEPPER);
    const defaultDeviceToken = `device-token-mentor-${i}`;
    const deviceTokenHash = hashSha256Hex(defaultDeviceToken);

    await prisma.dudiMentor.update({
      where: { id: mentor.id },
      data: {
        pinHash: defaultPinHash,
        pinSalt: salt,
        deviceTokenHash: mentor.deviceTokenHash || deviceTokenHash,
        tokenBoundAt: mentor.tokenBoundAt || new Date("2026-01-05T08:00:00.000Z"),
        failedPinAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log(
      `   ✅ Mentor: ${mentor.fullName} (${mentor.dudiPartner?.name || "DUDI"}) -> PIN: 1234`
    );
  }

  console.log("\n✨ Seluruh akun mentor DUDI berhasil disinkronisasi dengan PIN default 1234!");
}

main()
  .catch((e) => {
    console.error("Error sync mentor pins:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
