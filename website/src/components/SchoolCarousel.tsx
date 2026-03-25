"use client";

import { useState } from "react";

const schools = [
  {
    name: "University of Michigan",
    short: "UMich",
    color1: "#FFCB05",
    color2: "#00274C",
    students: 847,
    emoji: "〽️",
  },
  {
    name: "Harvard University",
    short: "Harvard",
    color1: "#A51C30",
    color2: "#F5F0E1",
    students: 612,
    emoji: "🎓",
  },
  {
    name: "Stanford University",
    short: "Stanford",
    color1: "#8C1515",
    color2: "#D2C295",
    students: 523,
    emoji: "🌲",
  },
];

function MiniPhoneMap({ color1, color2 }: { color1: string; color2: string }) {
  const dots = [
    { top: "22%", left: "30%" },
    { top: "38%", left: "55%" },
    { top: "52%", left: "28%" },
    { top: "35%", left: "72%" },
    { top: "60%", left: "50%" },
    { top: "25%", left: "65%" },
    { top: "48%", left: "40%" },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[1.5rem]" style={{ background: `linear-gradient(to bottom, ${color2}, #0A0A0A)` }}>
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="white" strokeWidth="0.5" />
        <line x1="60%" y1="0" x2="60%" y2="100%" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="white" strokeWidth="0.5" />
      </svg>
      {/* Dots */}
      {dots.map((d, i) => (
        <div key={i} className="absolute" style={{ top: d.top, left: d.left }}>
          <div className="absolute -inset-1.5 rounded-full animate-ping opacity-20" style={{ backgroundColor: color1, animationDuration: `${2 + i * 0.4}s`, animationDelay: `${i * 0.3}s` }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color1 }} />
        </div>
      ))}
      {/* Center user */}
      <div className="absolute top-[45%] left-[48%]">
        <div className="w-3 h-3 rounded-full bg-[#00E676]" />
      </div>
    </div>
  );
}

export function SchoolCarousel() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="space-y-12">
      {/* Three phones */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        {schools.map((school, i) => (
          <div
            key={school.short}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Glow */}
            <div
              className="absolute -inset-4 rounded-[3rem] blur-[40px] opacity-20 transition-opacity duration-500"
              style={{
                backgroundColor: school.color1,
                opacity: hoveredIdx === i ? 0.35 : 0.15,
              }}
            />

            {/* Phone */}
            <div
              className={`relative w-[200px] h-[400px] md:w-[220px] md:h-[440px] rounded-[2rem] bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-2xl shadow-black/50 ${
                i === 0 ? "animate-float-1" : i === 1 ? "animate-float-2" : "animate-float-3"
              }`}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-lg z-20" />

              {/* Header */}
              <div className="h-16 bg-black/80 backdrop-blur-sm flex items-end px-4 pb-1.5 z-10 relative">
                <div>
                  <div className="text-[10px] text-white/40">{school.name}</div>
                  <div className="text-[8px] flex items-center gap-1" style={{ color: school.color1 }}>
                    <span className="w-1 h-1 rounded-full bg-[#00E676]" />
                    {school.students} students
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 h-[calc(100%-4rem)]">
                <MiniPhoneMap color1={school.color1} color2={school.color2} />
              </div>

              {/* Home bar */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full bg-white/20" />
            </div>

            {/* School name below */}
            <div className="text-center mt-4">
              <div className="text-sm font-bold text-white">{school.short}</div>
              <div className="text-[10px] text-[#666]">{school.students} students</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-[#A0A0A0] mb-4">Your school could be next</p>
        <a
          href="#download"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#6C5CE7]/30 text-[#A29BFE] font-semibold text-sm hover:bg-[#6C5CE7]/10 transition-all duration-300"
        >
          Request Access
        </a>
      </div>
    </div>
  );
}
