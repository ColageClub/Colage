"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface FeatureSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  visual: React.ReactNode;
  reversed?: boolean;
  bgClass?: string;
  badge?: string;
}

export default function FeatureSection({
  id,
  title,
  subtitle,
  description,
  visual,
  reversed = false,
  bgClass = "bg-white",
  badge,
}: FeatureSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id={id} className={`py-24 md:py-32 ${bgClass}`}>
      <div
        ref={ref}
        className={`max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col ${
          reversed ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12 md:gap-24 lg:gap-32`}
      >
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? 40 : -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 max-w-2xl"
        >
          {badge && (
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-[#A51C30]/10 text-[#A51C30] rounded-full mb-4">
              {badge}
            </span>
          )}
          {subtitle && (
            <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
              {subtitle}
            </p>
          )}
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1E1E1E] leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {title}
          </h2>
          <p className="mt-6 text-lg md:text-xl text-[#6B6B6B] leading-relaxed font-light">
            {description}
          </p>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? -40 : 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          {visual}
        </motion.div>
      </div>
    </section>
  );
}
