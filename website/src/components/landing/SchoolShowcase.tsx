"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SectionWrapper, SectionHeading } from "./Section";

const SCHOOLS = [
  { name: "University of Michigan", domain: "umich.edu", color: "#FFCB05", accent: "#00274C" },
  { name: "Harvard University", domain: "harvard.edu", color: "#A51C30", accent: "#F5F0E1" },
  { name: "Stanford University", domain: "stanford.edu", color: "#8C1515", accent: "#D2C295" },
  { name: "MIT", domain: "mit.edu", color: "#A31F34", accent: "#8A8B8C" },
  { name: "UCLA", domain: "ucla.edu", color: "#2774AE", accent: "#FFD100" },
  { name: "NYU", domain: "nyu.edu", color: "#57068C", accent: "#FFFFFF" },
  { name: "Columbia University", domain: "columbia.edu", color: "#B9D9EB", accent: "#011A41" },
  { name: "Duke University", domain: "duke.edu", color: "#003087", accent: "#FFFFFF" },
];

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export default function SchoolShowcase() {
  const [sel, setSel] = useState(SCHOOLS[0]);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="schools">
      <SectionHeading badge="Your School" title="Every school has its own vibe." subtitle="Colage adapts to your university's branding. Your school, your colors, your community." />

      {/* Pills */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 48 }}
      >
        {SCHOOLS.map((s) => (
          <button
            key={s.domain}
            onClick={() => setSel(s)}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.3s",
              background: sel.domain === s.domain ? s.color : "#F9F6F2",
              color: sel.domain === s.domain ? (isLightColor(s.accent) ? "#fff" : s.accent) : "#6B6B6B",
              transform: sel.domain === s.domain ? "scale(1.05)" : "scale(1)",
              boxShadow: sel.domain === s.domain ? "0 4px 16px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {s.name}
          </button>
        ))}
      </motion.div>

      {/* Card */}
      <motion.div
        key={sel.domain}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{ maxWidth: 420, margin: "0 auto", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      >
        <div style={{ padding: 40, textAlign: "center", background: sel.color }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32 }}>🎓</span>
          </div>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, color: sel.accent }}>{sel.name}</h3>
          <p style={{ fontSize: 14, marginTop: 4, opacity: 0.7, color: sel.accent }}>on Colage</p>
        </div>
        <div style={{ background: "#fff", padding: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: sel.color, opacity: 0.25 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, width: 100, background: "#e8e8e8", borderRadius: 4 }} />
                <div style={{ height: 8, width: 60, background: "#f3f3f3", borderRadius: 4, marginTop: 6 }} />
              </div>
              <span style={{ fontSize: 13, color: "#6B6B6B" }}>{i * 47}ft</span>
            </div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
