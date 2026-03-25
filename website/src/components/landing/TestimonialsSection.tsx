"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionWrapper, SectionHeading } from "./Section";

const testimonials = [
  { quote: "I found my study group in the library without even asking. Just opened Colage and saw three CS majors on the same floor.", name: "Jordan K.", school: "University of Michigan", year: "Junior" },
  { quote: "The AR mode is insane. I was at a football game and could literally see profiles floating above people. Made like five new friends.", name: "Sofia R.", school: "Stanford University", year: "Sophomore" },
  { quote: "I graduated last year and the Alumni Network keeps me connected. Had coffee with a fellow alum I met through Colage in a new city.", name: "Marcus T.", school: "NYU", year: "Alumni '25" },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionWrapper bg="#fff">
      <SectionHeading badge="What Students Say" title="Real stories from real people." />
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: i * 0.12 }}
            style={{ padding: 32, borderRadius: 20, background: "#F9F6F2", position: "relative" }}
          >
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 64, color: "rgba(165,28,48,0.12)", position: "absolute", top: 12, left: 24, lineHeight: 1 }}>&ldquo;</span>
            <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.7, color: "#1E1E1E", position: "relative", zIndex: 1 }}>{t.quote}</p>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #E8E3DB" }}>
              <p style={{ fontWeight: 600, color: "#1E1E1E" }}>{t.name}</p>
              <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 2 }}>{t.school} · {t.year}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </SectionWrapper>
  );
}
