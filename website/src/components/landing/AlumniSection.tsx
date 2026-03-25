"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function AlumniSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="alumni" className="py-24 md:py-32 bg-[#1a0a0e] text-white overflow-hidden">
      <div ref={ref} className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex-1 max-w-2xl"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-[#A51C30]/30 text-[#C23B4A] rounded-full mb-4">
            Alumni Network
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Graduate? You&apos;re still in.
          </h2>
          <p className="mt-6 text-lg text-white/60 leading-relaxed font-light">
            The Alumni Network is one global server for graduates from every
            university. No matter where you went to school, you&apos;re part of the
            same community. Network, reconnect, or just see who&apos;s around — your
            Colage experience doesn&apos;t end at graduation.
          </p>
          <div className="mt-8 flex gap-8">
            <div>
              <p
                className="text-3xl font-light text-[#A51C30]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                1
              </p>
              <p className="text-sm text-white/40 mt-1">Global server</p>
            </div>
            <div>
              <p
                className="text-3xl font-light text-[#A51C30]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                All
              </p>
              <p className="text-sm text-white/40 mt-1">Schools welcome</p>
            </div>
            <div>
              <p
                className="text-3xl font-light text-[#A51C30]"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                ∞
              </p>
              <p className="text-sm text-white/40 mt-1">Connections</p>
            </div>
          </div>
        </motion.div>

        {/* Visual — Globe-like animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            {/* Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-[#A51C30]/20"
                style={{ margin: `${i * 30}px` }}
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 20 + i * 10,
                  ease: "linear",
                }}
              >
                {/* Dot on ring */}
                <div
                  className="absolute w-3 h-3 bg-[#A51C30] rounded-full shadow-lg shadow-[#A51C30]/50"
                  style={{ top: "50%", left: "-6px" }}
                />
              </motion.div>
            ))}
            {/* Center globe */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-[#A51C30]/30 to-[#A51C30]/5 border border-[#A51C30]/20 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">🌍</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
