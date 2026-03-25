"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Sign up with your .edu email",
    description:
      "Only verified students and graduates from accredited universities can join. Your .edu email is your key.",
    icon: "📧",
  },
  {
    number: "02",
    title: "Choose Student or Alumni",
    description:
      "Current students join their school's server. Graduates join the global Alumni Network — one community, every school.",
    icon: "🎓",
  },
  {
    number: "03",
    title: "Discover people around you",
    description:
      "See who's nearby on the map, browse the list, or explore in AR. Connect through social links — Instagram, Snapchat, LinkedIn, and more.",
    icon: "📍",
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#F9F6F2]">
      <div ref={ref} className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            How It Works
          </p>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Three steps to get started.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl">
                {step.icon}
              </div>

              {/* Step number */}
              <span
                className="text-5xl font-light text-[#A51C30]/20"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {step.number}
              </span>

              <h3 className="mt-2 text-xl font-semibold text-[#1E1E1E]">
                {step.title}
              </h3>
              <p className="mt-3 text-[#6B6B6B] font-light leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
