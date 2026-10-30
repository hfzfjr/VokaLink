import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "VokaLink — Ekosistem PKL SMK Terintegrasi";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          position: "relative",
          padding: "48px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Brand Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "32px",
            padding: "48px 64px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Logo Mark: Pure Vector SVG VokaLink Monogram */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "128px",
              height: "128px",
              borderRadius: "28px",
              background: "#FFFFFF",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              marginBottom: "24px",
            }}
          >
            <svg
              width="90"
              height="90"
              viewBox="0 0 279 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 50 12 C 47.5 12.5, 42.3 14.5, 38.5 16.4 C 13.9 28.6, 3.2 59.8, 15.4 83.8 C 16.7 86.4, 33 114.8, 51.5 147 C 70.1 179.2, 87.1 208.6, 89.3 212.5 C 99.6 230.7, 108.7 239.2, 122.6 244 C 140.9 250.4, 161.7 245.8, 175.8 232.4 C 181.2 227.3, 184.5 222.1, 201 193.5 C 221.7 157.7, 224 152.3, 224 140.5 C 224 121.7, 213.3 105.2, 195.5 96.6 C 183 90.5, 184.2 90.1, 175.5 104.7 L 168 117.5 L 174.4 118.2 C 185.5 119.3, 193.4 125.3, 196 134.6 C 198.5 143.5, 198.2 144.2, 172 190 C 166.2 200.1, 159.6 210.3, 157.3 212.6 C 147.7 222.5, 131 222.1, 121.4 211.8 C 119.7 210, 115.8 204.2, 112.8 199 C 44.8 81.3, 40.5 73.8, 39.2 70.1 C 37.6 65.5, 37.7 56.7, 39.3 52.7 C 43.9 41.9, 56.4 35.9, 67.9 39 C 75.6 41, 80.9 47.7, 96.4 75 C 114.4 106.5, 118.2 113, 119.1 113 C 119.9 113, 134.3 88.9, 134.3 87.5 C 134.3 85.7, 105 35.7, 100.7 30.1 C 95.8 23.8, 86.6 17.2, 78.3 14 C 71.7 11.5, 57.5 10.5, 50 12 Z"
                fill="#0F172A"
              />
              <path
                d="M 204.5 12.9 C 196.5 15.2, 189.5 19.1, 183.3 24.8 C 176.9 30.7, 177.5 29.8, 157.3 65 C 148 81.2, 135.2 103.3, 129 114 C 122.8 124.7, 114.1 139.6, 109.8 147 C 105.5 154.4, 102 161.2, 102 162.1 C 102 164.6, 115.5 187.5, 117 187.5 C 117.7 187.5, 121.6 181.6, 125.7 174.5 C 129.8 167.4, 140.1 149.6, 148.5 135 C 178.8 82.4, 196 52.8, 199 48.5 C 211.1 31, 238.2 37.5, 241.6 58.7 C 242.6 64.9, 240.5 70.4, 230.4 88 C 225.2 97.1, 221 105.2, 221 105.9 C 221 106.6, 221.9 108.3, 222.9 109.6 C 225.7 113.2, 230.9 126.2, 231.6 131.5 C 232 134, 232.6 136, 233.1 136 C 234.3 136, 236.8 132.1, 250.6 108 C 266.4 80.4, 268.1 76.2, 268.8 64.9 C 269.7 49.2, 264.9 36.6, 254.1 26 C 240.5 12.7, 222 7.8, 204.5 12.9 Z"
                fill="#0EA5E9"
              />
            </svg>
          </div>

          {/* Title & Slogan */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "48px",
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
              }}
            >
              Voka
            </span>
            <span
              style={{
                fontSize: "48px",
                fontWeight: 900,
                color: "#0EA5E9",
                letterSpacing: "-0.03em",
              }}
            >
              Link
            </span>
          </div>

          <p
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#94A3B8",
              margin: 0,
              textAlign: "center",
            }}
          >
            Ekosistem Praktik Kerja Lapangan (PKL) SMK Terintegrasi
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              color: "#38BDF8",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span>Verifikasi Zero-Login</span>
            <span>•</span>
            <span>Segel Digital Kriptografis</span>
            <span>•</span>
            <span>Paspor SKKNI</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

