"use client";

import { categoryColors, categoryGlow, type LiveEvent } from "./data";

export function EventCard({ event, onClose }: { event: LiveEvent; onClose: () => void }) {
  const color = categoryColors[event.category];

  return (
    <div
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 200,
        width: 420, maxWidth: "90vw",
        animation: "fadeInScale 0.3s ease-out",
      }}
    >
      {/* Backdrop click */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: -1 }}
      />

      <div style={{
        background: "rgba(8,8,16,0.95)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${color}40`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: `0 0 40px ${color}20, 0 0 80px rgba(0,0,0,0.5)`,
      }}>
        {/* Category bar */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              padding: "3px 10px", borderRadius: 4, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: `${color}20`, color, border: `1px solid ${color}30`,
            }}>
              {event.category === "academia" ? "📡 RESEARCH" :
               event.category === "sports" ? "🏟 SPORTS" :
               event.category === "student" ? "👤 SPOTLIGHT" : "🔥 TRENDING"}
            </div>
            <div style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}>
              SEV {event.severity}/10
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                cursor: "pointer", fontSize: 18, padding: 0,
              }}
            >×</button>
          </div>

          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "#fff",
            lineHeight: 1.3, marginBottom: 8,
          }}>{event.headline}</h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 16, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            <span>📍 {event.university}</span>
            <span>🕐 {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          padding: "16px 24px", margin: "0 12px",
          background: "rgba(255,255,255,0.03)", borderRadius: 8,
          borderLeft: `3px solid ${color}`,
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
            {event.summary}
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 24px 20px", display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: `${color}15`, border: `1px solid ${color}30`, color,
            cursor: "pointer", letterSpacing: "0.05em",
          }}>
            DRILL DEEPER →
          </button>
          <button style={{
            padding: "8px 16px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", cursor: "pointer",
          }}>
            LOCATE
          </button>
        </div>
      </div>
    </div>
  );
}
