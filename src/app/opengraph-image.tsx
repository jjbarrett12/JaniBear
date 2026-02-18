import { ImageResponse } from "next/og";

export const alt = "JANIBEAR – AI Software for Janitorial Sales & Operations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://janibear.com";
const logoUrl = `${siteUrl}/logo.png`;

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(165deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft radial glow behind text */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "80%",
            background: "radial-gradient(ellipse, #fbbf2414 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 64px",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoUrl}
              alt="JANIBEAR"
              width={220}
              height={72}
              style={{ objectFit: "contain", height: 56 }}
            />
          </div>

          {/* Headline block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 720,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 52,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Built for Serious
              <br />
              Janitorial Operators.
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#e6e6e6",
                letterSpacing: "0.02em",
                fontWeight: 600,
              }}
            >
              Sales. Quality. Proof. Automated.
            </div>
          </div>

          {/* URL bottom right */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#fbbf24",
                letterSpacing: "0.04em",
              }}
            >
              janibear.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
