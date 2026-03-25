"use client";

export default function PhoneMockup({
  label = "Colage",
  gradient = "linear-gradient(135deg, #A51C30, #5A0F1A)",
  icon = "📍",
}: {
  label?: string;
  gradient?: string;
  icon?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          inset: -16,
          background: gradient,
          opacity: 0.15,
          filter: "blur(40px)",
          borderRadius: "50%",
        }}
      />
      {/* Frame */}
      <div
        style={{
          position: "relative",
          width: 320,
          height: 660,
          background: "#1E1E1E",
          borderRadius: 48,
          border: "6px solid #2a2a2a",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 112,
            height: 28,
            background: "#1E1E1E",
            borderRadius: "0 0 16px 16px",
            zIndex: 2,
          }}
        />
        {/* Screen */}
        <div
          style={{
            height: "100%",
            width: "100%",
            background: gradient,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 56 }}>{icon}</span>
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
