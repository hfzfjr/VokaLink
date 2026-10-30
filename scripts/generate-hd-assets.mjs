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

// 2. Pure Square Logo on Clean White Background (512x512)
// NO text, NO frames, NO dark boxes, NO badges — ONLY THE CLEAN VECTOR LOGO
const pureLogo512Svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FFFFFF" />
  <!-- Logo viewBox is 279 x 256. Scale = 1.45 (width ~405, height ~371). Centered: x = 53.5, y = 70.5 -->
  <g transform="translate(54, 71) scale(1.45)">
    <path d="${path1}" fill="#0F172A" />
    <path d="${path2}" fill="#0EA5E9" />
  </g>
</svg>
`;

// 3. Pure Landscape Banner on Clean White Background (1200x630)
// ONLY THE CLEAN VECTOR LOGO CENTERED
const pureLogoOgSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FFFFFF" />
  <!-- Logo scale = 1.95 (width ~544, height ~499). Centered: x = 328, y = 65 -->
  <g transform="translate(328, 65) scale(1.95)">
    <path d="${path1}" fill="#0F172A" />
    <path d="${path2}" fill="#0EA5E9" />
  </g>
</svg>
`;

async function main() {
  console.log("Generating pure logo HD assets (only logo, no extra decorations)...");

  const logo512Buffer = Buffer.from(pureLogo512Svg);

  // 1. Root icon.png (512x512) - Primary square thumbnail for WhatsApp link preview
  const iconPngPath = path.join(webDir, "public", "icon.png");
  await sharp(logo512Buffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(iconPngPath);
  console.log("✓ Created HD icon.png (512x512, pure logo on white)");

  // 2. Apple touch icon (180x180)
  const appleIconPath = path.join(webDir, "public", "apple-icon.png");
  await sharp(logo512Buffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(appleIconPath);
  console.log("✓ Created HD apple-icon.png (180x180, pure logo on white)");

  // 3. Favicon and PWA icons
  const iconsDir = path.join(webDir, "public", "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  await sharp(logo512Buffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-512x512.png"));
  console.log("✓ Created HD icons/favicon-512x512.png");

  await sharp(logo512Buffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-192x192.png"));
  console.log("✓ Created HD icons/favicon-192x192.png");

  await sharp(logo512Buffer)
    .resize(32, 32)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-32x32.png"));
  console.log("✓ Created HD icons/favicon-32x32.png");

  await sharp(logo512Buffer)
    .resize(16, 16)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, "favicon-16x16.png"));
  console.log("✓ Created HD icons/favicon-16x16.png");

  // 4. Landscape OpenGraph Banner (1200x630) - pure logo on white
  const ogPngPath = path.join(webDir, "public", "og-image.png");
  await sharp(Buffer.from(pureLogoOgSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(ogPngPath);
  console.log("✓ Created HD og-image.png (1200x630, pure logo on white)");

  console.log("All pure logo HD assets generated successfully!");
}

main().catch((err) => {
  console.error("Failed to generate pure logo HD assets:", err);
  process.exit(1);
});
