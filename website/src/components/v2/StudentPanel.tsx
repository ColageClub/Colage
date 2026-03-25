"use client";

import { IntelEvent, COLORS } from "./data";

interface Props {
  events: IntelEvent[];
  flashId: string | null;
}

export function StudentPanel({ events, flashId }: Props) {
  const filtered = events.filter((e) => e.category === "students" || e.category === "trending").slice(0, 20);

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 320, right: 320, height: 80,
      background: "linear-gradient(0deg, rgba(3,3,8,0.95) 0%, rgba(3,3,8,0.4) 100%)",
      borderTop: "1px solid rgba(168,85,247,0.1)",
      overflowX: "auto", overflowY: "hidden",
      padding: "10px 16px",
      zIndex: 10,
      scrollbarWidth: "none",
      display: "flex", gap: 12, alignItems: "center",
    }}>
      {/* Label */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 60 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.students, boxShadow: `0 0 6px ${COLORS.students}` }} />
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.students, textAlign: "center", lineHeight: 1.2 }}>
          Human Intel
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
          Scanning for signals...
        </div>
      )}

      {filtered.map((evt) => {
        const color = COLORS[evt.category];
        const isFlashing = flashId === evt.id;
        return (
          <div
            key={evt.id}
            style={{
              flexShrink: 0, width: 260, padding: "8px 12px", borderRadius: 8,
              background: isFlashing ? `${color}15` : "rgba(255,255,255,0.03)",
              border: `1px solid ${isFlashing ? `${color}40` : "rgba(255,255,255,0.05)"}`,
              transition: "all 0.5s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: `${color}20`, border: `1px solid ${color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12,
              }}>
                {evt.category === "students" ? "🎓" : "🔥"}
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {evt.headline}
                </h4>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {evt.university.name} · {formatTime(evt.timestamp)}
                </div>
              </div>
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
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h`;
}
