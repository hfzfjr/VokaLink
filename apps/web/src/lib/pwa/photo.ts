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

export async function compressEvidencePhoto(
  file: File | Blob,
  maxDimension = 800,
  webpQuality = 0.65
): Promise<CompressedPhotoResult> {
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

  ctx.drawImage(img, 0, 0, width, height);

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
