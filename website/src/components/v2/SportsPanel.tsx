"use client";

import { IntelEvent, COLORS } from "./data";

interface Props {
  events: IntelEvent[];
  flashId: string | null;
}

export function SportsPanel({ events, flashId }: Props) {
  const filtered = events.filter((e) => e.category === "sports").slice(0, 12);

  return (
    <div style={{
      position: "absolute", right: 0, top: 60, bottom: 80, width: 320,
      background: "linear-gradient(270deg, rgba(3,3,8,0.92) 0%, rgba(3,3,8,0.4) 100%)",
      borderLeft: "1px solid rgba(34,197,94,0.1)",
      overflowY: "auto", overflowX: "hidden",
      padding: "16px 16px 16px 16px",
      zIndex: 10,
      scrollbarWidth: "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.sports, boxShadow: `0 0 8px ${COLORS.sports}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.sports }}>
          Sports Ops Center
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>
          Awaiting intel...
        </div>
      )}

      {filtered.map((evt) => {
        const isFlashing = flashId === evt.id;
        return (
          <div
            key={evt.id}
            style={{
              padding: 12, marginBottom: 8, borderRadius: 8,
              background: isFlashing ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isFlashing ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.05)"}`,
              transition: "all 0.5s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {evt.severity >= 4 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: evt.severity >= 5 ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)",
                  color: evt.severity >= 5 ? "#EF4444" : "#F97316",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  {evt.severity >= 5 ? "🚨 UPSET" : "⚡ ALERT"}
                </span>
              )}
            </div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>
              {evt.headline}
            </h4>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginBottom: 6 }}>
              {evt.summary}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
              <span>🏟️ {evt.university.name}</span>
              <span>{formatTime(evt.timestamp)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "LIVE";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}
