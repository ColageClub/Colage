"use client";

import { motion, useInView } from "framer-motion";
import { useRef, CSSProperties } from "react";

/* ── Wrapper for all sections ── */
export function SectionWrapper({
  id,
  bg = "#fff",
  children,
  style,
}: {
  id?: string;
  bg?: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section id={id} className="section-wrapper" style={{ padding: "120px 0", background: bg, ...style }}>
      <div className="section-inner">
        {children}
      </div>
    </section>
  );
}

/* ── Section heading (centered) ── */
export function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      style={{ textAlign: "center", marginBottom: 64 }}
    >
      {badge && (
        <span style={{ display: "inline-block", padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(165,28,48,0.1)", color: "#A51C30", borderRadius: 999, marginBottom: 16 }}>
          {badge}
        </span>
      )}
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, color: "#1E1E1E", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ marginTop: 16, fontSize: 18, color: "#6B6B6B", fontWeight: 300, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* ── Feature row: text + visual side by side ── */
export function FeatureRow({
  id,
  badge,
  title,
  description,
  visual,
  reversed = false,
  bg = "#fff",
}: {
  id?: string;
  badge?: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  reversed?: boolean;
  bg?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id={id} className="section-wrapper" style={{ padding: "120px 0", background: bg }}>
      <div ref={ref} className={reversed ? "flex-row-wrap-reverse section-inner" : "flex-row-wrap section-inner"}>
        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex-child"
        >
          {badge && (
            <span style={{ display: "inline-block", padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(165,28,48,0.1)", color: "#A51C30", borderRadius: 999, marginBottom: 16 }}>
              {badge}
            </span>
          )}
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 300, color: "#1E1E1E", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.7, color: "#6B6B6B", fontWeight: 300 }}>
            {description}
          </p>
        </motion.div>

        {/* Visual side */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? -40 : 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex-child"
          style={{ display: "flex", justifyContent: "center" }}
        >
          {visual}
        </motion.div>
      </div>
    </section>
  );
}
