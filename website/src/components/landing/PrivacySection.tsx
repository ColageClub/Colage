"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper, SectionHeading } from "./Section";

const items = [
  { icon: "🔒", title: ".edu Verified Only", desc: "Every user is verified through their university email. No fake accounts, no outsiders." },
  { icon: "💬", title: "No In-App Messaging", desc: "Colage is discovery-only. Connect through your real social links — Instagram, Snapchat, LinkedIn." },
  { icon: "📍", title: "Location When You Want", desc: "Your location is only shared when you choose to be visible. Toggle off anytime in settings." },
  { icon: "🛡️", title: "Your Data, Your Control", desc: "We don't sell your data. Your profile, your location, your choice. Delete your account anytime." },
];

export default function PrivacySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionWrapper id="privacy" bg="#F9F6F2">
      <SectionHeading badge="Privacy & Safety" title="Built with trust in mind." subtitle="Your safety isn't a feature — it's the foundation." />
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ display: "flex", gap: 20, padding: 28, borderRadius: 20, background: "#fff", transition: "box-shadow 0.3s" }}
            whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#F9F6F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1E1E1E" }}>{item.title}</h3>
              <p style={{ marginTop: 8, fontSize: 15, color: "#6B6B6B", fontWeight: 300, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </SectionWrapper>
  );
}
