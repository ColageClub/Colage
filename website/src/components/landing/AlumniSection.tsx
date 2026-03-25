"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function AlumniSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="alumni" className="section-wrapper" style={{ padding: "120px 0", background: "#1a0a0e", color: "#fff", overflow: "hidden" }}>
      <div ref={ref} className="flex-row-wrap section-inner">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex-child"
        >
          <span style={{ display: "inline-block", padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "rgba(165,28,48,0.3)", color: "#C23B4A", borderRadius: 999, marginBottom: 16 }}>
            Alumni Network
          </span>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 300, lineHeight: 1.15 }}>
            Graduate? You&apos;re still in.
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.7 }}>
            The Alumni Network is one global server for graduates from every university. No matter where you went to school, you&apos;re part of the same community. Network, reconnect, or just see who&apos;s around — your Colage experience doesn&apos;t end at graduation.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 40 }}>
            {[
              { val: "1", label: "Global server" },
              { val: "All", label: "Schools welcome" },
              { val: "∞", label: "Connections" },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 300, color: "#A51C30" }}>{s.val}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Globe visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-child"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div style={{ position: "relative", width: 340, height: 340 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  inset: i * 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(165,28,48,0.2)",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20 + i * 10, ease: "linear" }}
              >
                <div style={{ position: "absolute", top: "50%", left: -6, width: 12, height: 12, background: "#A51C30", borderRadius: "50%", boxShadow: "0 0 12px rgba(165,28,48,0.5)" }} />
              </motion.div>
            ))}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", background: "linear-gradient(135deg, rgba(165,28,48,0.3), rgba(165,28,48,0.05))", border: "1px solid rgba(165,28,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 64 }}>🌍</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
