"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function FooterCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{ padding: "120px 0 0", background: "#1a0a0e", color: "#fff" }}>
      {/* CTA */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: 700, margin: "0 auto", padding: "0 48px", textAlign: "center" }}
      >
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 300, letterSpacing: "-0.02em" }}>
          Be You.
        </h2>
        <p style={{ marginTop: 20, fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>
          Download Colage and start discovering the people around you.
        </p>

        <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { store: "App Store", sub: "Download on the", icon: "🍎" },
            { store: "Google Play", sub: "Get it on", icon: "▶️" },
          ].map((b) => (
            <a
              key={b.store}
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 24px",
                background: "#fff",
                color: "#1E1E1E",
                borderRadius: 14,
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>{b.sub}</div>
                <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>{b.store}</div>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Footer bar */}
      <div style={{ maxWidth: 1200, margin: "96px auto 0", padding: "24px 48px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300 }}>Colage</span>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "FAQ", href: "#faq" },
            { label: "Advertise", href: "/ads/dashboard" },
          ].map((l) => (
            <a key={l.label} href={l.href} style={{ color: "inherit", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >{l.label}</a>
          ))}
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>© {new Date().getFullYear()} Colage. All rights reserved.</p>
      </div>
    </section>
  );
}
