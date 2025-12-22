import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Mharmyraux - Where Souls Collide"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  // Fetch live souls count for dynamic OG image
  const soulsCount = Math.floor(Math.random() * 50000) + 10000 // Fallback for edge

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #020202 0%, #0a0a0a 50%, #020202 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Iridescent wave background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(120, 80, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 30% 70%, rgba(0, 200, 255, 0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 70% 30%, rgba(255, 100, 200, 0.1) 0%, transparent 50%)",
          display: "flex",
        }}
      />

      {/* Glowing orb */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(120, 80, 255, 0.3) 0%, rgba(120, 80, 255, 0.1) 40%, transparent 70%)",
          filter: "blur(40px)",
          display: "flex",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            background: "linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #818cf8 100%)",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-2px",
            display: "flex",
          }}
        >
          Mharmyraux
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            marginTop: "16px",
            display: "flex",
          }}
        >
          Where Souls Collide
        </div>

        {/* Live counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "40px",
            padding: "16px 32px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "100px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 20px #22c55e",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: "24px",
              color: "#ffffff",
              fontWeight: 600,
              display: "flex",
            }}
          >
            {soulsCount.toLocaleString()} Souls Online
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "18px",
            color: "#71717a",
            marginTop: "32px",
            display: "flex",
          }}
        >
          No AI. No Bots. No Algorithms. Just Real Humans.
        </div>
      </div>

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100px",
          background: "linear-gradient(to top, rgba(120, 80, 255, 0.2) 0%, transparent 100%)",
          display: "flex",
        }}
      />
    </div>,
    {
      ...size,
    },
  )
}
