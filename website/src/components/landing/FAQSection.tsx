"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Is Colage free?",
    a: "Yes. Colage is completely free for students and alumni. We make money through local business advertising, not your data.",
  },
  {
    q: "What schools are supported?",
    a: "Any accredited college or university with a .edu email domain. When you sign up, we automatically detect your school and create its server if it doesn't exist yet.",
  },
  {
    q: "How is this different from other social apps?",
    a: "Colage is discovery-only — no DMs, no feeds, no posts. You discover people near you and connect through your real social links (Instagram, Snapchat, etc.). It's about real-world connection, not another timeline.",
  },
  {
    q: "What happens to my location data?",
    a: "Your location is only shared while you're actively visible. You can toggle visibility off anytime. We don't store location history or sell your data. Ever.",
  },
  {
    q: "Can I use Colage after I graduate?",
    a: "Absolutely. When you graduate, you can join the Alumni Network — a single global server for graduates from every school. Your Colage experience doesn't end with your degree.",
  },
  {
    q: "Is there messaging in the app?",
    a: "No. By design, Colage has no in-app messaging. You connect through your social media links. This keeps the app focused on discovery and reduces harassment.",
  },
  {
    q: "What platforms is Colage available on?",
    a: "iOS and Android. Both apps have full feature parity — map, list, and AR discovery modes.",
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#E8E3DB]">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-[#1E1E1E] group-hover:text-[#A51C30] transition-colors pr-8">
          {q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-2xl text-[#A51C30] shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[#6B6B6B] font-light leading-relaxed max-w-3xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div ref={ref} className="max-w-3xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#A51C30] tracking-wider uppercase mb-3">
            FAQ
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-[#1E1E1E] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Questions? Answered.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
