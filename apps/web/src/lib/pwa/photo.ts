/**
 * Client-Side Photo Pipeline (FR-006 & DESIGN.md §7.1)
 * Mengompresi foto kegiatan magang ke WebP (< 60 KB, maks 150 KB),
 * menghapus metadata privasi EXIF/geotag, dan menghasilkan hash SHA-256.
 */

export interface CompressedPhotoResult {
  blob: Blob;
  sha256: string;
  sizeBytes: number;
  mimeType: string;
  originalSizeBytes: number;
  savingsPercentage: number;
  savingsText: string;
}

export async function computeSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BlurArea {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export interface CompressPhotoOptions {
  maxDimension?: number;
  webpQuality?: number;
  applyPrivacyBlur?: boolean;
  blurArea?: BlurArea;
}

export async function compressEvidencePhoto(
  file: File | Blob,
  optionsOrMaxDimension: number | CompressPhotoOptions = 800,
  legacyQuality = 0.65
): Promise<CompressedPhotoResult> {
  const options: CompressPhotoOptions =
    typeof optionsOrMaxDimension === "number"
      ? { maxDimension: optionsOrMaxDimension, webpQuality: legacyQuality }
      : {
          maxDimension: optionsOrMaxDimension.maxDimension ?? 800,
          webpQuality: optionsOrMaxDimension.webpQuality ?? 0.65,
          applyPrivacyBlur: optionsOrMaxDimension.applyPrivacyBlur ?? false,
          blurArea: optionsOrMaxDimension.blurArea,
        };

  const maxDimension = options.maxDimension ?? 800;
  const webpQuality = options.webpQuality ?? 0.65;
  const originalSizeBytes = file.size;

  // 1. Load image into HTMLImageElement
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Gagal membaca file gambar"));
    img.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  // 2. Hitung dimensi proporsional (sisi terpanjang maks 800px)
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // 3. Render ke Canvas (otomatis menghapus EXIF dan Geotagging)
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Gagal membuat konteks rendering 2D Canvas");
  }

  // Render dasar gambar
  ctx.drawImage(img, 0, 0, width, height);

  // 3b. Terapkan Sensor Privasi / Privacy Blur jika diaktifkan (FR-006 & TC-003)
  if (options.applyPrivacyBlur) {
    const rawBx = options.blurArea
      ? Math.round(width * options.blurArea.xRatio)
      : Math.round(width * 0.1);
    const rawBy = options.blurArea
      ? Math.round(height * options.blurArea.yRatio)
      : Math.round(height * 0.35);
    const rawBw = options.blurArea
      ? Math.round(width * options.blurArea.widthRatio)
      : Math.round(width * 0.8);
    const rawBh = options.blurArea
      ? Math.round(height * options.blurArea.heightRatio)
      : Math.round(height * 0.35);

    // Clamp boundary agar tidak pernah melebihi canvas
    const bx = Math.max(0, Math.min(width - 20, rawBx));
    const by = Math.max(0, Math.min(height - 20, rawBy));
    const bw = Math.max(20, Math.min(width - bx, rawBw));
    const bh = Math.max(20, Math.min(height - by, rawBh));

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.filter = "blur(18px)";
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();

    // Visual overlay sensor privasi (frosted glass + hairline cyan border)
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(14, 165, 233, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bx, by, bw, bh);

    // Label watermark privasi DUDI
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    const badgeW = Math.min(180, bw - 8);
    const badgeH = 22;
    ctx.fillRect(bx + 4, by + 4, badgeW, badgeH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("SENSOR PRIVASI DUDI (NDA)", bx + 10, by + 19);
    ctx.restore();
  }

  // 4. Konversi ke Blob WebP (Fallback ke JPEG jika browser tidak mendukung WebP encoder)
  let mimeType = "image/webp";
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, webpQuality)
  );

  if (!blob || blob.type !== "image/webp") {
    mimeType = "image/jpeg";
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, 0.6)
    );
  }

  if (!blob) {
    throw new Error("Gagal mengompresi gambar ke biner WebP / JPEG");
  }

  // 4b. Jaminan Ukuran Server <= 150 KB (PRD FR-006 & DESIGN §7.1)
  // Bila ukuran biner melebihi 145 KB akibat gambar ber-noise tinggi, turunkan kualitas adaptif
  const HARD_LIMIT_BYTES = 145 * 1024;
  let adaptiveQuality = webpQuality;

  while (blob.size > HARD_LIMIT_BYTES && adaptiveQuality > 0.25) {
    adaptiveQuality -= 0.12;
    const retryBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, adaptiveQuality)
    );
    if (retryBlob && retryBlob.size < blob.size) {
      blob = retryBlob;
    } else {
      break;
    }
  }

  // Jika masih melebihi batas, downscale kanvas sisi terpanjang ke 600px
  if (blob.size > HARD_LIMIT_BYTES) {
    const scaleFactor = 0.75;
    const miniCanvas = document.createElement("canvas");
    miniCanvas.width = Math.round(canvas.width * scaleFactor);
    miniCanvas.height = Math.round(canvas.height * scaleFactor);
    const miniCtx = miniCanvas.getContext("2d");
    if (miniCtx) {
      miniCtx.drawImage(canvas, 0, 0, miniCanvas.width, miniCanvas.height);
      const scaledBlob = await new Promise<Blob | null>((resolve) =>
        miniCanvas.toBlob((b) => resolve(b), mimeType, 0.55)
      );
      if (scaledBlob) {
        blob = scaledBlob;
      }
    }
  }

  // 5. Hitung hash SHA-256
  const sha256 = await computeSha256(blob);
  const sizeBytes = blob.size;

  // Hitung penghematan kuota
  const savingsBytes = Math.max(0, originalSizeBytes - sizeBytes);
  const savingsPercentage = originalSizeBytes > 0
    ? Math.round((savingsBytes / originalSizeBytes) * 100)
    : 0;

  const originalKb = (originalSizeBytes / 1024).toFixed(1);
  const compressedKb = (sizeBytes / 1024).toFixed(1);
  const savingsText = `Hemat kuota: ${originalKb} KB menjadi ${compressedKb} KB (-${savingsPercentage}%)`;

  return {
    blob,
    sha256,
    sizeBytes,
    mimeType,
    originalSizeBytes,
    savingsPercentage,
    savingsText,
  };
}
