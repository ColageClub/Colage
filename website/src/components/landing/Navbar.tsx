"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#map" },
  { label: "Alumni", href: "#alumni" },
  { label: "Schools", href: "#schools" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "background 0.3s, box-shadow 0.3s",
          background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 clamp(20px, 4vw, 48px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
          }}
        >
          <a
            href="#"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 300,
              color: scrolled ? "#1E1E1E" : "#fff",
              textDecoration: "none",
              transition: "color 0.3s",
            }}
          >
            Colage
          </a>

          {/* Desktop */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-desktop">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: scrolled ? "#6B6B6B" : "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#A51C30")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = scrolled ? "#6B6B6B" : "rgba(255,255,255,0.7)")
                }
              >
                {l.label}
              </a>
            ))}
            <a
              href="#"
              style={{
                padding: "10px 24px",
                background: "#A51C30",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 999,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#8C1515")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#A51C30")}
            >
              Download
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="nav-mobile-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <div style={{ width: 24, height: 2, background: scrolled ? "#1E1E1E" : "#fff", marginBottom: 6, transition: "0.3s" }} />
            <div style={{ width: 24, height: 2, background: scrolled ? "#1E1E1E" : "#fff", marginBottom: 6, transition: "0.3s" }} />
            <div style={{ width: 24, height: 2, background: scrolled ? "#1E1E1E" : "#fff", transition: "0.3s" }} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "#1a0a0e",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 32,
            }}
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 28,
                  color: "rgba(255,255,255,0.8)",
                  textDecoration: "none",
                }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
