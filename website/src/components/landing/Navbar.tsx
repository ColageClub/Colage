"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#map" },
  { label: "Alumni", href: "#alumni" },
  { label: "Schools", href: "#schools" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="#"
            className={`text-2xl font-light transition-colors duration-300 ${
              scrolled ? "text-[#1E1E1E]" : "text-white"
            }`}
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Colage
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-300 hover:text-[#A51C30] ${
                  scrolled ? "text-[#6B6B6B]" : "text-white/70"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#"
              className="px-5 py-2 bg-[#A51C30] text-white text-sm font-medium rounded-full hover:bg-[#8C1515] transition-colors"
            >
              Download
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5"
          >
            <span
              className={`w-6 h-0.5 transition-all duration-300 ${
                scrolled ? "bg-[#1E1E1E]" : "bg-white"
              } ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`w-6 h-0.5 transition-all duration-300 ${
                scrolled ? "bg-[#1E1E1E]" : "bg-white"
              } ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`w-6 h-0.5 transition-all duration-300 ${
                scrolled ? "bg-[#1E1E1E]" : "bg-white"
              } ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6"
          >
            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-light text-[#1E1E1E] hover:text-[#A51C30] transition-colors"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#"
                className="mt-4 inline-block text-center px-8 py-3.5 bg-[#A51C30] text-white font-medium rounded-full"
              >
                Download
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
