"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: "🔒",
    title: ".edu Verified Only",
    description: "Every user is verified through their university email. No fake accounts, no outsiders.",
  },
  {
    icon: "💬",
    title: "No In-App Messaging",
    description: "Colage is discovery-only. Connect through your real social links — Instagram, Snapchat, LinkedIn.",
  },
  {
    icon: "📍",
    title: "Location When You Want",
    description: "Your location is only shared when you choose to be visible. Toggle off anytime in settings.",
  },
  {
    icon: "🛡️",
    title: "Your Data, Your Control",
    description: "We don't sell your data. Your profile, your location, your choice. Delete your account anytime.",
  },
];

export default function PrivacySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="privacy" className="py-24 md:py-32 bg-white">
      <div ref={ref} className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            Privacy & Safety
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Built with trust in mind.
          </h2>
          <p className="mt-4 text-lg text-[#6B6B6B] font-light max-w-2xl mx-auto">
            Your safety isn&apos;t a feature — it&apos;s the foundation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex gap-5 p-6 rounded-2xl bg-[#F9F6F2] hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1E1E1E]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[#6B6B6B] font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
