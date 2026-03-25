"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

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

export default function SchoolShowcase() {
  const [selected, setSelected] = useState(SCHOOLS[0]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="schools" className="py-24 md:py-32 bg-[#F9F6F2]">
      <div ref={ref} className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            Your School
          </p>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Every school has its own vibe.
          </h2>
          <p className="mt-4 text-lg text-[#6B6B6B] font-light max-w-2xl mx-auto">
            Colage adapts to your university&apos;s branding. Your school, your colors, your community.
          </p>
        </motion.div>

        {/* School pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {SCHOOLS.map((school) => (
            <button
              key={school.domain}
              onClick={() => setSelected(school)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selected.domain === school.domain
                  ? "text-white shadow-lg scale-105"
                  : "bg-white text-[#6B6B6B] hover:bg-white/80"
              }`}
              style={
                selected.domain === school.domain
                  ? { backgroundColor: school.color }
                  : {}
              }
            >
              {school.name}
            </button>
          ))}
        </motion.div>

        {/* Preview card */}
        <motion.div
          key={selected.domain}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md md:max-w-lg mx-auto rounded-3xl overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div
            className="p-8 text-center"
            style={{ backgroundColor: selected.color }}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
              <span className="text-3xl">🎓</span>
            </div>
            <h3
              className="text-2xl font-light"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: selected.accent,
              }}
            >
              {selected.name}
            </h3>
            <p
              className="text-sm mt-1 opacity-70"
              style={{ color: selected.accent }}
            >
              on Colage
            </p>
          </div>

          {/* Mock student list */}
          <div className="bg-white p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full opacity-30"
                  style={{ backgroundColor: selected.color }}
                />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-2 bg-gray-100 rounded w-16 mt-2" />
                </div>
                <div className="text-xs text-[#6B6B6B]">{i * 47}ft</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
