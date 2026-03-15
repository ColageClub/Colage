"use client";

import { useEffect, useState } from "react";

const mockStudents = [
  { name: "Alex M.", major: "Computer Science", emoji: "🧑‍💻", socials: ["ig", "snap"] },
  { name: "Maya K.", major: "Pre-Med", emoji: "👩‍⚕️", socials: ["ig", "tiktok"] },
  { name: "Jordan T.", major: "Business", emoji: "👨‍💼", socials: ["ig", "twitter"] },
  { name: "Sam R.", major: "Art & Design", emoji: "👨‍🎨", socials: ["ig", "tiktok", "snap"] },
  { name: "Riley W.", major: "Engineering", emoji: "👩‍🔬", socials: ["ig"] },
  { name: "Casey P.", major: "Music", emoji: "🧑‍🎤", socials: ["ig", "snap", "tiktok"] },
  { name: "Avery N.", major: "Psychology", emoji: "🧠", socials: ["ig", "twitter"] },
];

export function FloatingStudents() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mockStudents.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[400px]">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(108,92,231,0.08)" />
            <stop offset="50%" stopColor="rgba(108,92,231,0.2)" />
            <stop offset="100%" stopColor="rgba(108,92,231,0.08)" />
          </linearGradient>
        </defs>
        <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="35%" y1="70%" x2="50%" y2="50%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="50%" y1="50%" x2="65%" y2="70%" stroke="url(#lineGrad)" strokeWidth="1" />
      </svg>

      {/* Student bubbles */}
      {mockStudents.map((student, i) => {
        const isActive = i === activeIndex;
        const positions = [
          { top: "15%", left: "15%" },
          { top: "5%", left: "45%" },
          { top: "15%", left: "75%" },
          { top: "45%", left: "5%" },
          { top: "50%", left: "85%" },
          { top: "70%", left: "25%" },
          { top: "70%", left: "65%" },
        ];
        const pos = positions[i];

        return (
          <div
            key={student.name}
            className={`absolute transition-all duration-700 ${isActive ? "scale-110 z-10" : "scale-100 z-0"}`}
            style={{ top: pos.top, left: pos.left }}
          >
            <div
              className={`relative p-4 rounded-2xl border backdrop-blur-sm transition-all duration-700 ${
                isActive
                  ? "bg-white border-[#6C5CE7]/20 shadow-lg shadow-[#6C5CE7]/10"
                  : "bg-white/80 border-gray-100"
              }`}
            >
              {isActive && (
                <div className="absolute -inset-1 rounded-2xl bg-[#6C5CE7]/5 animate-pulse" />
              )}

              <div className="relative flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${
                  isActive ? "bg-[#6C5CE7]/10 ring-2 ring-[#6C5CE7]/30" : "bg-gray-50"
                }`}>
                  {student.emoji}
                </div>
                <div>
                  <div className={`text-sm font-bold transition-colors duration-500 ${isActive ? "text-[#1a1a2e]" : "text-[#9090a8]"}`}>
                    {student.name}
                  </div>
                  <div className="text-[10px] text-[#9090a8]">{student.major}</div>
                  <div className="flex gap-1 mt-1">
                    {student.socials.map((s) => (
                      <span key={s} className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#f3f2ff] text-[#6C5CE7]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Center "you" indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[#00b894]/10 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute -inset-2 rounded-full bg-[#00b894]/10" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00b894] to-[#00CEC9] flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-[#00b894]/20">
            You
          </div>
        </div>
      </div>
    </div>
  );
}
