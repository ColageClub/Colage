"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function FooterCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <>
      {/* CTA */}
      <section className="py-24 md:py-32 bg-[#1a0a0e] text-white">
        <div ref={ref} className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-5xl md:text-7xl font-light tracking-tight"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Be You.
            </h2>
            <p className="mt-6 text-lg text-white/60 font-light max-w-lg mx-auto">
              Download Colage and start discovering the people around you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#1E1E1E] font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                App Store
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Google Play
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#110608] text-white/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-light text-white/70"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Colage
              </span>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="/privacy" className="hover:text-white/70 transition-colors">
                Privacy
              </a>
              <a href="/terms" className="hover:text-white/70 transition-colors">
                Terms
              </a>
              <a href="#faq" className="hover:text-white/70 transition-colors">
                FAQ
              </a>
              <a href="/ads/dashboard" className="hover:text-white/70 transition-colors">
                Advertise
              </a>
            </div>

            <p className="text-xs">
              © {new Date().getFullYear()} Colage. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
