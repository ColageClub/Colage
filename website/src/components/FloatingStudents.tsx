"use client";

import { useEffect, useState } from "react";

const mockStudents = [
  { name: "Alex M.", major: "Computer Science", emoji: "🧑‍💻", socials: ["ig", "snap"], x: 15, y: 20 },
  { name: "Maya K.", major: "Pre-Med", emoji: "👩‍⚕️", socials: ["ig", "tiktok"], x: 75, y: 12 },
  { name: "Jordan T.", major: "Business", emoji: "👨‍💼", socials: ["ig", "twitter"], x: 8, y: 55 },
  { name: "Sam R.", major: "Art & Design", emoji: "👨‍🎨", socials: ["ig", "tiktok", "snap"], x: 82, y: 52 },
  { name: "Riley W.", major: "Engineering", emoji: "👩‍🔬", socials: ["ig"], x: 22, y: 78 },
  { name: "Casey P.", major: "Music", emoji: "🧑‍🎤", socials: ["ig", "snap", "tiktok"], x: 72, y: 80 },
  { name: "Avery N.", major: "Psychology", emoji: "🧠", socials: ["ig", "twitter"], x: 48, y: 8 },
];

const socialIcons: Record<string, string> = {
  ig: "📷",
  snap: "👻",
  tiktok: "🎵",
  twitter: "🐦",
};

export function FloatingStudents() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mockStudents.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[500px] md:h-[600px]">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00CEC9" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {mockStudents.map((s, i) => (
          <line
            key={s.name}
            x1="50%"
            y1="50%"
            x2={`${s.x}%`}
            y2={`${s.y}%`}
            stroke="url(#lineGradDark)"
            strokeWidth={activeIndex === i ? 2 : 0.5}
            strokeDasharray={activeIndex === i ? "none" : "4 4"}
            className="transition-all duration-700"
          />
        ))}
      </svg>

      {/* Center "You" */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[#00E676]/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute -inset-2 rounded-full bg-[#00E676]/10" />
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E676] to-[#00CEC9] flex items-center justify-center text-lg font-bold text-black shadow-lg shadow-[#00E676]/20">
            You
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-[#A0A0A0]">Your location</div>
      </div>

      {/* Student bubbles */}
      {mockStudents.map((student, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={student.name}
            className="absolute transition-all duration-700"
            style={{
              left: `${student.x}%`,
              top: `${student.y}%`,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.15 : 0.9})`,
              zIndex: isActive ? 15 : 5,
            }}
          >
            <div className={`glass-card p-3 transition-all duration-500 ${isActive ? "border-[#6C5CE7]/40 shadow-lg shadow-[#6C5CE7]/20" : ""}`}>
              {isActive && (
                <div className="absolute -inset-1 rounded-2xl bg-[#6C5CE7]/10 animate-pulse" />
              )}
              <div className="relative flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
                  isActive ? "bg-[#6C5CE7]/20 ring-2 ring-[#6C5CE7]/30" : "bg-white/5"
                }`}>
                  {student.emoji}
                </div>
                <div>
                  <div className={`text-sm font-bold transition-colors duration-500 ${isActive ? "text-white" : "text-[#666]"}`}>
                    {student.name}
                  </div>
                  <div className="text-[10px] text-[#666]">{student.major}</div>
                  {isActive && (
                    <div className="flex gap-1 mt-1">
                      {student.socials.map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#6C5CE7]/20 text-[#A29BFE]">
                          {socialIcons[s]} {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
