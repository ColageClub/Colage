"use client";

import { useState } from "react";

const features = [
  {
    id: "map",
    title: "Live Map",
    subtitle: "Real-time campus view",
    description: "See every verified student around you as a live dot on the map. University-themed colors. Tap anyone to see their profile and social links.",
    icon: "🗺️",
    visual: (
      <div className="relative w-full h-full bg-gradient-to-b from-[#00274C] to-[#0a0a1a] rounded-2xl overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-[#FFCB05] animate-pulse"
            style={{
              top: `${15 + Math.random() * 65}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00b894] border-2 border-white/30">
          <div className="absolute -inset-2 rounded-full bg-[#00b894]/30 animate-ping" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 h-3 rounded-full bg-white/5" />
      </div>
    ),
  },
  {
    id: "list",
    title: "Proximity List",
    subtitle: "Sorted by distance",
    description: "Browse nearby students in a clean grid. Slide to adjust your radius. See who's on your floor. Find people by major, not just location.",
    icon: "📋",
    visual: (
      <div className="w-full h-full bg-[#0a0a1a] rounded-2xl p-4 space-y-2.5 overflow-hidden">
        {[
          { name: "Alex M.", major: "CS", dist: "120 ft", emoji: "🧑‍💻" },
          { name: "Maya K.", major: "Pre-Med", dist: "240 ft", emoji: "👩‍⚕️" },
          { name: "Jordan T.", major: "Business", dist: "380 ft", emoji: "👨‍💼" },
          { name: "Sam R.", major: "Art", dist: "510 ft", emoji: "👨‍🎨" },
          { name: "Riley W.", major: "Engineering", dist: "720 ft", emoji: "👩‍🔬" },
        ].map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="w-9 h-9 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center text-base">{s.emoji}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white/80">{s.name}</div>
              <div className="text-[9px] text-white/30">{s.major}</div>
            </div>
            <div className="text-[9px] text-[#6C5CE7] font-mono">{s.dist}</div>
          </div>
        ))}
        <div className="pt-2">
          <div className="h-1 rounded-full bg-white/5">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe]" />
          </div>
          <div className="flex justify-between mt-1 text-[8px] text-white/20">
            <span>0 ft</span>
            <span>5000 ft</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "ar",
    title: "AR Discovery",
    subtitle: "Camera-powered",
    description: "Point your phone and see floating profiles in augmented reality. Names, majors, and social links hover in the real world. The future is here.",
    icon: "📱",
    visual: (
      <div className="relative w-full h-full bg-gradient-to-b from-[#1a1a2e] to-[#0a0a1a] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        {[
          { top: "20%", left: "20%", name: "Alex", emoji: "🧑‍💻" },
          { top: "35%", left: "60%", name: "Maya", emoji: "👩‍⚕️" },
          { top: "60%", left: "35%", name: "Sam", emoji: "👨‍🎨" },
        ].map((b) => (
          <div key={b.name} className="absolute animate-float" style={{ top: b.top, left: b.left }}>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 flex items-center justify-center text-lg shadow-lg shadow-[#6C5CE7]/20">
                {b.emoji}
              </div>
              <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[8px] font-bold text-[#a29bfe]">
                {b.name}
              </div>
            </div>
          </div>
        ))}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6C5CE7] to-transparent animate-scan" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-semibold text-white/50">AR MODE</span>
        </div>
      </div>
    ),
  },
];

export function FeatureShowcase() {
  const [active, setActive] = useState("map");
  const activeFeature = features.find((f) => f.id === active)!;

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left: Feature selector */}
      <div className="space-y-4">
        {features.map((feature) => {
          const isActive = feature.id === active;
          return (
            <button
              key={feature.id}
              onClick={() => setActive(feature.id)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-500 ${
                isActive
                  ? "bg-[#6C5CE7]/5 border-[#6C5CE7]/20 shadow-lg shadow-[#6C5CE7]/5"
                  : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-3xl transition-all duration-300 ${isActive ? "scale-110" : "scale-100 opacity-40"}`}>
                  {feature.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${isActive ? "text-[#1a1a2e]" : "text-[#9090a8]"}`}>
                      {feature.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 ${
                      isActive ? "bg-[#6C5CE7]/10 text-[#6C5CE7]" : "bg-gray-100 text-[#9090a8]"
                    }`}>
                      {feature.subtitle}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 leading-relaxed transition-colors duration-300 ${isActive ? "text-[#5a5a7a]" : "text-[#9090a8]"}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: Visual preview — these stay dark since they represent the app */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-br from-[#6C5CE7]/8 to-[#00CEC9]/5 rounded-3xl blur-xl" />
        <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl border border-gray-200 overflow-hidden shadow-xl">
          {activeFeature.visual}
        </div>
      </div>
    </div>
  );
}
