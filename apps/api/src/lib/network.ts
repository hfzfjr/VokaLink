import os from "node:os";

/**
 * Mendeteksi IP Address IPv4 lokal pada interface jaringan aktif (misal Wi-Fi / Ethernet LAN).
 * Digunakan agar perangkat mobile (smartphone mentor) pada jaringan Wi-Fi yang sama
 * dapat memindai kode QR dan membuka URL pengesahan secara langsung.
 */
export function getLocalIPv4(): string | null {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

