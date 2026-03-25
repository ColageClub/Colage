"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper, SectionHeading } from "./Section";

const steps = [
  { num: "01", icon: "📧", title: "Sign up with your .edu email", desc: "Only verified students from accredited universities can join. Your .edu email is your key in." },
  { num: "02", icon: "🎓", title: "Join your school's server", desc: "You're automatically placed into your university's server with other students from your campus." },
  { num: "03", icon: "📍", title: "Discover people around you", desc: "See who's nearby on the map, browse the list, or explore in AR. Connect through social links — Instagram, Snapchat, LinkedIn, and more." },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="how-it-works" bg="#F9F6F2">
      <SectionHeading badge="How It Works" title="Three steps to get started." />
      <div ref={ref} className="grid-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: i * 0.15 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ width: 72, height: 72, margin: "0 auto 20px", borderRadius: 16, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              {s.icon}
            </div>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 48, fontWeight: 300, color: "rgba(165,28,48,0.2)" }}>{s.num}</span>
            <h3 style={{ marginTop: 8, fontSize: 20, fontWeight: 600, color: "#1E1E1E" }}>{s.title}</h3>
            <p style={{ marginTop: 12, fontSize: 16, color: "#6B6B6B", fontWeight: 300, lineHeight: 1.6 }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
