"use client";

import { useState } from "react";

const schools = [
  {
    name: "University of Michigan",
    domain: "umich.edu",
    color: "#FFCB05",
    accent: "#00274C",
    students: 847,
    city: "Ann Arbor, MI",
    mascot: "🐺",
    vibe: "The Big House energy meets campus life",
  },
  {
    name: "Harvard University",
    domain: "harvard.edu",
    color: "#A51C30",
    accent: "#F5F0E1",
    students: 512,
    city: "Cambridge, MA",
    mascot: "📚",
    vibe: "Where old tradition meets new connections",
  },
  {
    name: "Stanford University",
    domain: "stanford.edu",
    color: "#8C1515",
    accent: "#D2C295",
    students: 623,
    city: "Stanford, CA",
    mascot: "🌲",
    vibe: "Silicon Valley starts on campus",
  },
];

export function SchoolCarousel() {
  const [active, setActive] = useState(0);
  const school = schools[active];

  return (
    <div>
      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {schools.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.domain}
              onClick={() => setActive(i)}
              className={`relative group text-left p-8 rounded-3xl border transition-all duration-500 overflow-hidden ${
                isActive
                  ? "border-white/20 shadow-2xl scale-[1.02]"
                  : "border-white/5 hover:border-white/10"
              }`}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${s.color}15, ${s.accent}10, transparent)`
                  : "rgba(255,255,255,0.02)",
              }}
            >
              {/* Background mascot */}
              <div className={`absolute top-4 right-4 text-6xl transition-all duration-500 ${isActive ? "opacity-20 scale-110" : "opacity-5"}`}>
                {s.mascot}
              </div>

              {/* Color dot */}
              <div
                className="w-10 h-10 rounded-full mb-4 transition-all duration-500"
                style={{
                  backgroundColor: s.color,
                  boxShadow: isActive ? `0 0 30px ${s.color}40` : "none",
                }}
              />

              <h3 className={`text-lg font-bold mb-1 transition-colors duration-300 ${isActive ? "text-white" : "text-white/50"}`}>
                {s.name}
              </h3>
              <p className="text-xs text-white/30 mb-4">{s.city}</p>

              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-black" style={{ color: isActive ? s.color : "rgba(255,255,255,0.3)" }}>
                    {s.students}
                  </div>
                  <div className="text-[10px] text-white/30">students</div>
                </div>
                <div className={`flex-1 text-xs italic transition-colors duration-300 ${isActive ? "text-white/40" : "text-white/15"}`}>
                  &ldquo;{s.vibe}&rdquo;
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${s.color}, transparent)` }} />
              )}
            </button>
          );
        })}
      </div>

      {/* "Your school" CTA */}
      <div className="text-center">
        <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-white/2 border border-dashed border-white/10">
          <div className="text-4xl mb-3">🎓</div>
          <h3 className="text-lg font-bold mb-1">Your school not here?</h3>
          <p className="text-sm text-white/30 mb-4 max-w-xs">
            Download Colage with your .edu email and be the first at your campus. We auto-create your school with custom branding.
          </p>
          <div className="flex gap-2">
            {["MIT", "NYU", "UCLA", "Georgia Tech", "UT Austin"].map((name) => (
              <span key={name} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/20 border border-white/5">
                {name}
              </span>
            ))}
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#6C5CE7]/10 text-[#a29bfe] border border-[#6C5CE7]/20">
              +4,000 more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
