"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function BusinessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-[#F9F6F2]">
      <div ref={ref} className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            For Businesses
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Reach students where they are.
          </h2>
          <p className="mt-6 text-lg text-[#6B6B6B] font-light max-w-2xl mx-auto leading-relaxed">
            Colage Ads puts your business in front of verified college students —
            location-targeted, campus-specific, and measurable. Coffee shops,
            gyms, bookstores, restaurants: if you&apos;re near campus, students
            will see you.
          </p>
          <div className="mt-10">
            <a
              href="/ads/dashboard"
              className="inline-block px-8 py-3.5 bg-[#A51C30] text-white font-medium rounded-full hover:bg-[#8C1515] transition-colors duration-300 text-sm tracking-wide"
            >
              Advertise on Colage
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
