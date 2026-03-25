"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    quote: "I found my study group in the library without even asking. Just opened Colage and saw three CS majors on the same floor.",
    name: "Jordan K.",
    school: "University of Michigan",
    year: "Junior",
  },
  {
    quote: "The AR mode is insane. I was at a football game and could literally see profiles floating above people. Made like five new friends.",
    name: "Sofia R.",
    school: "Stanford University",
    year: "Sophomore",
  },
  {
    quote: "I graduated last year and the Alumni Network keeps me connected. Had coffee with a fellow alum I met through Colage in a new city.",
    name: "Marcus T.",
    school: "NYU",
    year: "Alumni '25",
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-white">
      <div ref={ref} className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            What Students Say
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Real stories from real people.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="p-8 rounded-2xl bg-[#F9F6F2] relative"
            >
              {/* Quote mark */}
              <span
                className="text-6xl text-[#A51C30]/15 absolute top-4 left-6 leading-none"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                &ldquo;
              </span>

              <p className="text-[#1E1E1E] leading-relaxed mt-6 relative z-10">
                {t.quote}
              </p>

              <div className="mt-6 pt-6 border-t border-[#E8E3DB]">
                <p className="font-semibold text-[#1E1E1E]">{t.name}</p>
                <p className="text-sm text-[#6B6B6B]">
                  {t.school} · {t.year}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
