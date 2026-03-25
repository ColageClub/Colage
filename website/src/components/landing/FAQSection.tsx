"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionWrapper, SectionHeading } from "./Section";

const faqs = [
  { q: "Is Colage free?", a: "Yes — Colage is completely free for students and alumni. Download, sign up with your .edu email, and start discovering." },
  { q: "What schools are supported?", a: "Any accredited university or college with a .edu email domain. If your school isn't on Colage yet, you'll be the first — and your school's server will be created automatically." },
  { q: "How is this different from other social apps?", a: "Colage is discovery-only. There's no messaging, no feed, no algorithm deciding what you see. You discover real people near you and connect through your existing social links." },
  { q: "What happens to my location data?", a: "Your location is only shared when you're visible on the map. You can toggle visibility off at any time. We never sell location data and it's not stored permanently." },
  { q: "What happens when I graduate?", a: "You can switch to the Alumni Network — a completely separate server for graduates only. You leave your school's student server and join a global alumni community. There's no overlap between student and alumni servers." },
  { q: "Is there messaging in the app?", a: "No. Colage is purely for discovery. You connect with people through their social links — Instagram, Snapchat, LinkedIn, etc. This keeps the app focused and safe." },
  { q: "What platforms is Colage available on?", a: "Colage is available on iOS and Android. Download from the App Store or Google Play." },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E8E3DB" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 18, fontWeight: 500, color: "#1E1E1E", paddingRight: 32 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} style={{ fontSize: 24, color: "#A51C30", flexShrink: 0 }}>+</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ paddingBottom: 24, fontSize: 16, color: "#6B6B6B", fontWeight: 300, lineHeight: 1.7, maxWidth: 600 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" style={{ padding: "120px 0", background: "#fff" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 48px" }}>
        <SectionHeading badge="FAQ" title="Questions? Answered." />
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>
          {faqs.map((f) => <Item key={f.q} q={f.q} a={f.a} />)}
        </motion.div>
      </div>
    </section>
  );
}
