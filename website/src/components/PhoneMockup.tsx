"use client";

import { useEffect, useState } from "react";

const students = [
  { name: "Alex", emoji: "🧑‍🎓", top: "18%", left: "28%", color: "#FFCB05" },
  { name: "Maya", emoji: "👩‍🎓", top: "32%", left: "62%", color: "#FFCB05" },
  { name: "Jordan", emoji: "🧑‍💻", top: "48%", left: "22%", color: "#FFCB05" },
  { name: "You", emoji: "📍", top: "38%", left: "44%", color: "#00b894" },
  { name: "Sam", emoji: "👨‍🎨", top: "55%", left: "68%", color: "#FFCB05" },
  { name: "Riley", emoji: "👩‍🔬", top: "25%", left: "78%", color: "#FFCB05" },
  { name: "Casey", emoji: "🧑‍🎤", top: "62%", left: "38%", color: "#FFCB05" },
];

export function PhoneMockup() {
  const [activeMode, setActiveMode] = useState("Map");
  const [showAd, setShowAd] = useState(true);
  const [hoveredStudent, setHoveredStudent] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowAd((prev) => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group">
      {/* Glow behind phone */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6C5CE7]/20 to-[#00CEC9]/10 rounded-[4rem] blur-[60px] scale-90 group-hover:scale-100 transition-transform duration-700" />

      {/* Phone frame */}
      <div className="relative w-[300px] h-[620px] rounded-[3rem] bg-[#0a0a1a] border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-20" />

        {/* Status bar */}
        <div className="h-12 bg-[#050510] flex items-center justify-between px-8 text-[10px] text-white/40 z-10 relative">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3.5 h-2 border border-white/40 rounded-sm relative">
              <div className="absolute inset-0.5 bg-[#00b894] rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between bg-[#050510]/80 backdrop-blur-sm z-10 relative">
          <div>
            <div className="text-xs text-white/40">University of Michigan</div>
            <div className="text-[10px] text-[#FFCB05]/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00b894]" />
              847 students nearby
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7]/30 to-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-xs">
            👤
          </div>
        </div>

        {/* Map area */}
        <div className="relative flex-1 h-[420px] bg-gradient-to-b from-[#00274C] to-[#0a0a1a]">
          {/* Grid roads */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="white" strokeWidth="0.5" />
            <line x1="60%" y1="0" x2="60%" y2="100%" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="35%" x2="100%" y2="35%" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="65%" x2="100%" y2="65%" stroke="white" strokeWidth="0.5" />
          </svg>

          {/* Building blocks */}
          {[
            { top: "10%", left: "10%", w: "35px", h: "25px" },
            { top: "45%", left: "50%", w: "40px", h: "30px" },
            { top: "70%", left: "15%", w: "30px", h: "20px" },
            { top: "15%", left: "55%", w: "25px", h: "35px" },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded bg-white/5 border border-white/5"
              style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
            />
          ))}

          {/* Student dots */}
          {students.map((s, i) => (
            <div
              key={s.name}
              className="absolute cursor-pointer transition-all duration-500"
              style={{
                top: s.top,
                left: s.left,
                animationDelay: `${i * 0.5}s`,
                zIndex: hoveredStudent === s.name ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredStudent(s.name)}
              onMouseLeave={() => setHoveredStudent(null)}
            >
              {/* Pulse ring */}
              <div
                className="absolute -inset-2 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: s.color, animationDuration: `${2 + i * 0.3}s` }}
              />
              {/* Dot */}
              <div
                className="w-4 h-4 rounded-full border-2 border-[#050510] relative z-10 flex items-center justify-center text-[8px]"
                style={{ backgroundColor: s.color }}
              >
                {s.name === "You" && "📍"}
              </div>
              {/* Name label */}
              {(hoveredStudent === s.name || s.name === "You") && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-black/80 text-[8px] font-semibold z-20"
                  style={{ color: s.color }}
                >
                  {s.name}
                </div>
              )}
            </div>
          ))}

          {/* Mode switcher */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-0.5 bg-black/60 backdrop-blur-lg rounded-full p-0.5 z-10">
            {["Map", "List", "AR"].map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`px-5 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                  activeMode === mode
                    ? "bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/30"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Ad banner */}
          <div className={`absolute bottom-3 left-2 right-2 z-10 transition-all duration-500 ${showAd ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <div className="h-14 rounded-2xl bg-[#0a0a1a]/90 backdrop-blur-xl border border-white/10 flex items-center px-3 gap-3 relative overflow-hidden">
              <div className="absolute right-2 text-4xl opacity-5">☕</div>
              <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center text-lg z-10">☕</div>
              <div className="flex-1 z-10">
                <div className="text-[11px] font-bold">Blue Brew Coffee</div>
                <div className="text-[9px] text-[#00b894] font-medium">15% off — Show this ad</div>
              </div>
              <div className="text-[9px] text-white/30 z-10">0.2 mi</div>
            </div>
          </div>
        </div>

        {/* Home bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
