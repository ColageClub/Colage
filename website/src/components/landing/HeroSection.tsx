"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const LogoTunnel = dynamic(() => import("./LogoTunnel"), { ssr: false });

export default function HeroSection() {
  return (
    <section style={{ position: "relative", height: "100vh", width: "100%", overflow: "hidden", background: "#0a0a0a" }}>
      {/* Animated color blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        {/* Blob 1 — purple/violet */}
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-10%",
            left: "10%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Blob 2 — blue */}
        <motion.div
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 100, -60, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "20%",
            right: "5%",
            width: "45vw",
            height: "45vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Blob 3 — pink/magenta */}
        <motion.div
          animate={{
            x: [0, 60, -100, 0],
            y: [0, -40, 80, 0],
            scale: [1, 1.1, 0.85, 1],
          }}
          transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: "0%",
            left: "30%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Blob 4 — orange/amber */}
        <motion.div
          animate={{
            x: [0, -80, 40, 0],
            y: [0, 60, -80, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "50%",
            left: "-5%",
            width: "35vw",
            height: "35vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,146,60,0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Blob 5 — teal/cyan */}
        <motion.div
          animate={{
            x: [0, 90, -60, 0],
            y: [0, -70, 50, 0],
            scale: [1, 1.2, 0.95, 1],
          }}
          transition={{ repeat: Infinity, duration: 24, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: "10%",
            right: "15%",
            width: "30vw",
            height: "30vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.35) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Three.js logo tunnel on top of blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <LogoTunnel />
      </div>

      {/* Subtle vignette */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,10,10,0.6) 100%)", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 24px" }}>
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
          style={{ marginTop: 24, fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.7)", fontWeight: 300, letterSpacing: "0.02em", maxWidth: 500 }}
        >
          See who&apos;s on campus. Connect in real life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          style={{ marginTop: 40, display: "flex", gap: 16 }}
        >
          <a href="#about" style={{ padding: "14px 32px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 500, borderRadius: 999, textDecoration: "none", fontSize: 14, letterSpacing: "0.03em", transition: "background 0.2s" }}>
            Get Started
          </a>
          <a href="#how-it-works" style={{ padding: "14px 32px", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 500, borderRadius: 999, textDecoration: "none", fontSize: 14, letterSpacing: "0.03em", transition: "background 0.2s" }}>
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
            style={{ width: 24, height: 40, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 999, display: "flex", justifyContent: "center", paddingTop: 8 }}
          >
            <div style={{ width: 6, height: 6, background: "rgba(255,255,255,0.5)", borderRadius: "50%" }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
