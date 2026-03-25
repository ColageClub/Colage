"use client";

import { IntelEvent, COLORS } from "./data";

interface Props {
  events: IntelEvent[];
  flashId: string | null;
}

export function AcademiaPanel({ events, flashId }: Props) {
  const filtered = events.filter((e) => e.category === "academia").slice(0, 12);

  return (
    <div style={{
      position: "absolute", left: 0, top: 60, bottom: 80, width: 320,
      background: "linear-gradient(90deg, rgba(3,3,8,0.92) 0%, rgba(3,3,8,0.4) 100%)",
      borderRight: "1px solid rgba(59,130,246,0.1)",
      overflowY: "auto", overflowX: "hidden",
      padding: "16px 16px 16px 16px",
      zIndex: 10,
      scrollbarWidth: "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.academia, boxShadow: `0 0 8px ${COLORS.academia}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.academia }}>
          Academia Intelligence
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
              background: isFlashing ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isFlashing ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.05)"}`,
              transition: "all 0.5s ease",
              animation: isFlashing ? "panelFlash 1s ease" : "none",
            }}
          >
            {/* Severity bar */}
            <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{
                  width: 16, height: 3, borderRadius: 2,
                  background: i <= evt.severity
                    ? evt.severity >= 4 ? "#EF4444" : evt.severity >= 3 ? "#F59E0B" : "#22C55E"
                    : "rgba(255,255,255,0.08)",
                }} />
              ))}
            </div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>
              {evt.headline}
            </h4>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginBottom: 6 }}>
              {evt.summary}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
              <span>📍 {evt.university.name}</span>
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
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}
