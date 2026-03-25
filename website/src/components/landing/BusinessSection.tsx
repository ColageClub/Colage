"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function BusinessSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{ padding: "120px 0", background: "#F9F6F2" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: 700, margin: "0 auto", padding: "0 48px", textAlign: "center" }}
      >
        <span style={{ display: "inline-block", padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "rgba(165,28,48,0.1)", color: "#A51C30", borderRadius: 999, marginBottom: 16 }}>
          For Businesses
        </span>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 300, color: "#1E1E1E", lineHeight: 1.15 }}>
          Reach students where they are.
        </h2>
        <p style={{ marginTop: 20, fontSize: 18, color: "#6B6B6B", fontWeight: 300, lineHeight: 1.7 }}>
          Colage Ads puts your business in front of verified college students — location-targeted, campus-specific, and measurable. Coffee shops, gyms, bookstores, restaurants: if you&apos;re near campus, students will see you.
        </p>
        <a
          href="/ads/dashboard"
          style={{ display: "inline-block", marginTop: 32, padding: "14px 32px", background: "#A51C30", color: "#fff", fontWeight: 500, borderRadius: 999, textDecoration: "none", fontSize: 14, letterSpacing: "0.03em", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#8C1515")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#A51C30")}
        >
          Advertise on Colage
        </a>
      </motion.div>
    </section>
  );
}
