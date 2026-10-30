import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "apps", "web");
const require = createRequire(import.meta.url);
const sharp = require(path.join(webDir, "node_modules", "sharp"));

// 1. Read the vector icon
const svgPath = path.join(webDir, "public", "icons", "vokalink-icon.svg");
const svgContent = fs.readFileSync(svgPath, "utf-8");

// Extract paths from svgContent
const pathMatches = [...svgContent.matchAll(/<path\s+d="([^"]+)"\s+fill="([^"]+)"/g)];
const path1 = pathMatches[0] ? pathMatches[0][1] : "";
const path2 = pathMatches[1] ? pathMatches[1][1] : "";

// 2. Generate 512x512 Square Icon SVG (WhatsApp, Telegram, Apple Touch, Favicons)
// Pure crisp white background with rounded-3xl container and centered interlocking vector monogram
const icon512Svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>
  <!-- Clean solid rounded card for maximum contrast on dark and light WhatsApp themes -->
  <rect width="512" height="512" rx="96" fill="url(#icon-bg)" />
  <rect width="504" height="504" x="4" y="4" rx="92" fill="none" stroke="#e2e8f0" stroke-width="8" />
  <!-- Embedded High-Definition VokaLink Vector Monogram -->
  <g transform="translate(86, 80) scale(1.22)">
    <path d="${path1}" fill="#0F172A" />
    <path d="${path2}" fill="#0EA5E9" />
  </g>
</svg>
`;

// 3. Generate 1200x630 OpenGraph Banner SVG
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <radialGradient id="glow1" cx="80%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2" cx="20%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow1)" />
  <rect width="1200" height="630" fill="url(#glow2)" />

  <!-- Center Card Frame -->
  <g filter="url(#shadow)">
    <rect x="150" y="85" width="900" height="460" rx="36" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2" />
  </g>

  <!-- Top Badge: Platform Resmi -->
  <g transform="translate(600, 140)">
    <rect x="-140" y="-18" width="280" height="36" rx="18" fill="#0ea5e9" fill-opacity="0.15" stroke="#0ea5e9" stroke-opacity="0.4" stroke-width="1.5" />
    <circle cx="-105" cy="0" r="5" fill="#10b981" />
    <text x="-90" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#38bdf8" letter-spacing="1.5">VERIFIKASI RESMI DUDI</text>
  </g>

  <!-- Logo Badge Center -->
  <g transform="translate(600, 240)">
    <rect x="-65" y="-65" width="130" height="130" rx="30" fill="#ffffff" filter="url(#badge-shadow)" />
    <!-- Embedded VokaLink SVG Icon -->
    <g transform="translate(-48, -44) scale(0.345)">
      <path d="${path1}" fill="#0F172A" />
      <path d="${path2}" fill="#0EA5E9" />
    </g>
  </g>

  <!-- Title & Subtitle -->
  <text x="600" y="375" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-0.5">VokaLink</text>
  <text x="600" y="415" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="#94a3b8">Pengesahan Jurnal PKL Siswa SMK oleh Mentor Industri</text>

  <!-- Security Footer Badge -->
  <g transform="translate(600, 480)">
    <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#1e293b" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
    <text x="0" y="5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="500" fill="#cbd5e1">
      🔒 Tautan Aman 1x Pakai · Segel Kriptografi HMAC-SHA256
    </text>
  </g>
</svg>
`;

async function main() {
  console.log("Generating HD assets from vokalink-icon.svg...");

  const iconBuffer = Buffer.from(icon512Svg);

  // 1. Root icon.png (512x512) - Primary square thumbnail for WhatsApp link preview
  const iconPngPath = path.join(webDir, "public", "icon.png");
  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(iconPngPath);
  console.log("✓ Created HD icon.png (512x512)");

  // 2. Apple touch icon (180x180)
  const appleIconPath = path.join(webDir, "public", "apple-icon.png");
  await sharp(iconBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(appleIconPath);
  console.log("✓ Created HD apple-icon.png (180x180)");

  // 3. Icons directory (PWA & browser fallbacks)
  const iconsDir = path.join(webDir, "public", "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-512x512.png"));
  console.log("✓ Created HD icons/favicon-512x512.png");

  await sharp(iconBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-192x192.png"));
  console.log("✓ Created HD icons/favicon-192x192.png");

  await sharp(iconBuffer)
    .resize(32, 32)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-32x32.png"));
  console.log("✓ Created HD icons/favicon-32x32.png");

  await sharp(iconBuffer)
    .resize(16, 16)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-16x16.png"));
  console.log("✓ Created HD icons/favicon-16x16.png");

  // 4. Large Landscape OpenGraph Banner (1200x630)
  const ogPngPath = path.join(webDir, "public", "og-image.png");
  await sharp(Buffer.from(ogSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(ogPngPath);
  console.log("✓ Created HD og-image.png (1200x630)");

  console.log("All HD assets generated successfully!");
}

main().catch((err) => {
  console.error("Failed to generate HD assets:", err);
  process.exit(1);
});
