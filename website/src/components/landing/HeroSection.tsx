"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const LogoTunnel = dynamic(() => import("./LogoTunnel"), { ssr: false });

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#1a0a0e]">
      {/* Three.js background */}
      <LogoTunnel />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#1a0a0e]/60 via-transparent to-[#1a0a0e]/80 pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-radial-[at_center] from-transparent via-transparent to-[#1a0a0e]/70 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1
            className="font-serif text-7xl md:text-9xl font-light text-white tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Be You.
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-6 text-lg md:text-xl text-white/70 max-w-md font-light tracking-wide"
        >
          The social discovery app for college students and alumni.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-10 flex gap-4"
        >
          <a
            href="#about"
            className="px-8 py-3.5 bg-[#A51C30] text-white font-medium rounded-full hover:bg-[#8C1515] transition-colors duration-300 text-sm tracking-wide"
          >
            Get Started
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors duration-300 text-sm tracking-wide"
          >
            Learn More
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
