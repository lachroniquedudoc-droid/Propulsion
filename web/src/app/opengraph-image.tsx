import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Propulsion — La communauté des entrepreneurs panafricains";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "#0F0F0E",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Brand stripe top */}
        <div style={{ display: "flex", height: 6, width: "100%" }}>
          {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Ambient orb */}
        <div style={{
          position: "absolute", top: -80, left: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, #3871c2 0%, transparent 70%)",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: -60,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, #ffac42 0%, transparent 70%)",
          opacity: 0.2,
        }} />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 80px", gap: 28, flex: 1, justifyContent: "center" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 3, width: 40, background: "linear-gradient(90deg, #3871c2, #ffac42, #766391, #ff1e58, #22c55e)", borderRadius: 4 }} />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>
              Communauté Entrepreneuriale
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "white", fontSize: 72, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.02em" }}>
              Propulsion
            </span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 28, fontWeight: 400, lineHeight: 1.4, maxWidth: 620 }}>
              Masterclasses, networking et challenges — les entrepreneurs africains qui agissent.
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 48, marginTop: 12 }}>
            {[
              { val: "18",  label: "Modules" },
              { val: "7+",  label: "Pays actifs" },
              { val: "3",   label: "Formules" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "white", fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{s.val}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 80px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>propulsion.cnic.africa</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>CNIC · Dr Claudel Noubissie</span>
        </div>

        {/* Brand stripe bottom */}
        <div style={{ display: "flex", height: 4, width: "100%" }}>
          {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
