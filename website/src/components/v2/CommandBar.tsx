"use client";

import { useState } from "react";
import { EventCategory, COLORS } from "./data";

interface Props {
  activeFilters: Set<EventCategory>;
  onToggleFilter: (cat: EventCategory) => void;
  onPulse: () => void;
  onSearch: (query: string) => void;
}

export function CommandBar({ activeFilters, onToggleFilter, onPulse, onSearch }: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  const filters: { cat: EventCategory; label: string; icon: string }[] = [
    { cat: "academia", label: "Research", icon: "🔬" },
    { cat: "sports", label: "Sports", icon: "🏆" },
    { cat: "students", label: "Students", icon: "🎓" },
    { cat: "trending", label: "Trending", icon: "🔥" },
  ];

  return (
    <>
      {/* Hover trigger zone */}
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, height: 40, zIndex: 100 }}
        onMouseEnter={() => setVisible(true)}
      />
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99,
          transform: visible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease",
          background: "linear-gradient(180deg, rgba(3,3,8,0.95) 0%, rgba(3,3,8,0.8) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(6,182,212,0.15)",
          padding: "12px 24px",
        }}
        onMouseLeave={() => setVisible(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 1400, margin: "0 auto" }}>
          {/* Logo */}
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 300, color: "#06B6D4", letterSpacing: "0.05em" }}>
            COLAGE<span style={{ fontSize: 10, color: "rgba(6,182,212,0.5)", marginLeft: 6 }}>INTEL</span>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
              placeholder="Search universities, events..."
              style={{
                width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(6,182,212,0.2)",
                color: "#fff", fontSize: 13, outline: "none",
              }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.4 }}>⌕</span>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 6 }}>
            {filters.map((f) => {
              const active = activeFilters.has(f.cat);
              return (
                <button
                  key={f.cat}
                  onClick={() => onToggleFilter(f.cat)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${active ? COLORS[f.cat] : "rgba(255,255,255,0.1)"}`,
                    background: active ? `${COLORS[f.cat]}20` : "transparent",
                    color: active ? COLORS[f.cat] : "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <span>{f.icon}</span> {f.label}
                </button>
              );
            })}
          </div>

          {/* Pulse */}
          <button
            onClick={onPulse}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "linear-gradient(135deg, #06B6D4, #EC4899)",
              color: "#fff", border: "none", cursor: "pointer",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            ⚡ PULSE
          </button>
        </div>
      </div>
    </>
  );
}
