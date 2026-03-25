"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const LogoTunnel = dynamic(() => import("./LogoTunnel"), { ssr: false });

export default function HeroSection() {
  return (
    <section style={{ position: "relative", height: "100vh", width: "100%", overflow: "hidden", background: "#1a0a0e" }}>
      <LogoTunnel />

      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "linear-gradient(to bottom, rgba(26,10,14,0.6), transparent, rgba(26,10,14,0.8))", pointerEvents: "none" }} />

      {/* Content — always centered */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 24px" }}>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(64px, 10vw, 140px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          Be You.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          style={{ marginTop: 24, fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", fontWeight: 300, letterSpacing: "0.02em", maxWidth: 500 }}
        >
          The social discovery app for college students and alumni.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          style={{ marginTop: 40, display: "flex", gap: 16 }}
        >
          <a href="#about" style={{ padding: "14px 32px", background: "#A51C30", color: "#fff", fontWeight: 500, borderRadius: 999, textDecoration: "none", fontSize: 14, letterSpacing: "0.03em" }}>
            Get Started
          </a>
          <a href="#how-it-works" style={{ padding: "14px 32px", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 500, borderRadius: 999, textDecoration: "none", fontSize: 14, letterSpacing: "0.03em" }}>
            Learn More
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)" }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ width: 24, height: 40, border: "2px solid rgba(255,255,255,0.3)", borderRadius: 999, display: "flex", justifyContent: "center", paddingTop: 8 }}
          >
            <div style={{ width: 6, height: 6, background: "rgba(255,255,255,0.6)", borderRadius: "50%" }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
