"use client";

import { useState } from "react";

const tabs = [
  { id: "map", label: "🗺️ Map", title: "Live Map", subtitle: "See everyone around you in real-time" },
  { id: "list", label: "📋 List", title: "Proximity List", subtitle: "Browse nearby students sorted by distance" },
  { id: "ar", label: "📱 AR", title: "AR Discovery", subtitle: "Point your phone and discover who's nearby" },
];

const studentDots = [
  { top: "20%", left: "30%", color: "#FFCB05", delay: "0s" },
  { top: "35%", left: "55%", color: "#FFCB05", delay: "0.5s" },
  { top: "50%", left: "25%", color: "#FFCB05", delay: "1s" },
  { top: "40%", left: "70%", color: "#FFCB05", delay: "0.3s" },
  { top: "65%", left: "45%", color: "#6C5CE7", delay: "0.7s" },
  { top: "28%", left: "80%", color: "#FFCB05", delay: "1.2s" },
];

const listStudents = [
  { name: "Alex K.", major: "Computer Science", dist: "0.1 mi", emoji: "🧑‍🎓" },
  { name: "Maya R.", major: "Design", dist: "0.2 mi", emoji: "👩‍🎓" },
  { name: "Jordan P.", major: "Engineering", dist: "0.3 mi", emoji: "🧑‍💻" },
  { name: "Sam W.", major: "Film Studies", dist: "0.4 mi", emoji: "👨‍🎨" },
  { name: "Riley C.", major: "Biology", dist: "0.5 mi", emoji: "👩‍🔬" },
];

const arProfiles = [
  { name: "Alex", top: "25%", left: "20%", delay: "0s" },
  { name: "Maya", top: "35%", left: "65%", delay: "0.3s" },
  { name: "Jordan", top: "55%", left: "40%", delay: "0.6s" },
];

function MapView() {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#00274C] to-[#0a0a1a] overflow-hidden rounded-2xl">
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="white" strokeWidth="0.5" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="0.5" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="white" strokeWidth="0.5" />
      </svg>
      {[
        { top: "12%", left: "12%", w: 40, h: 28 },
        { top: "50%", left: "55%", w: 45, h: 32 },
        { top: "72%", left: "18%", w: 35, h: 24 },
      ].map((b, i) => (
        <div key={i} className="absolute rounded bg-white/5 border border-white/5" style={{ top: b.top, left: b.left, width: b.w, height: b.h }} />
      ))}
      {studentDots.map((d, i) => (
        <div key={i} className="absolute" style={{ top: d.top, left: d.left }}>
          <div className="absolute -inset-2 rounded-full animate-ping opacity-30" style={{ backgroundColor: d.color, animationDuration: "2.5s", animationDelay: d.delay }} />
          <div className="w-3 h-3 rounded-full border-2 border-[#0a0a1a]" style={{ backgroundColor: d.color }} />
        </div>
      ))}
      <div className="absolute top-[45%] left-[48%]">
        <div className="absolute -inset-3 rounded-full bg-[#00E676]/20 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="w-4 h-4 rounded-full bg-[#00E676] border-2 border-[#0a0a1a]" />
      </div>
    </div>
  );
}

function ListView() {
  return (
    <div className="w-full h-full bg-[#0A0A0A] rounded-2xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[#A0A0A0]">Nearby &middot; 0.5 mi radius</div>
        <div className="w-20 h-1.5 rounded-full bg-[#333] relative">
          <div className="absolute left-0 top-0 w-3/5 h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE]" />
        </div>
      </div>
      <div className="space-y-2">
        {listStudents.map((s) => (
          <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#6C5CE7]/30 transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center text-base">{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">{s.name}</div>
              <div className="text-[10px] text-[#666]">{s.major}</div>
            </div>
            <div className="text-[10px] text-[#00CEC9] font-medium">{s.dist}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ARView() {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-2xl overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(108,92,231,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,0.05) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }} />
      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00CEC9] to-transparent animate-scan" />
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6C5CE7]/20 border border-[#6C5CE7]/30">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
        <span className="text-[10px] font-semibold text-[#A29BFE]">AR Mode</span>
      </div>
      {arProfiles.map((p, i) => (
        <div
          key={p.name}
          className="absolute animate-float"
          style={{ top: p.top, left: p.left, animationDelay: p.delay, animationDuration: `${3 + i * 0.5}s` }}
        >
          <div className="glass-card px-3 py-2 text-center">
            <div className="text-xs font-semibold text-white">{p.name}</div>
            <div className="text-[10px] text-[#00CEC9]">0.{i + 1} mi</div>
          </div>
        </div>
      ))}
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#6C5CE7]/40 rounded-tr" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#6C5CE7]/40 rounded-bl" />
    </div>
  );
}

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState("map");

  return (
    <div className="flex flex-col items-center">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/30"
                : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-10 w-full max-w-5xl">
        {/* Info */}
        <div className="flex-1 text-center lg:text-left">
          {tabs.filter((t) => t.id === activeTab).map((tab) => (
            <div key={tab.id}>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">{tab.title}</h3>
              <p className="text-lg text-[#A0A0A0]">{tab.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="relative">
          <div className="absolute -inset-8 bg-gradient-to-b from-[#6C5CE7]/15 to-[#00CEC9]/10 rounded-[4rem] blur-[60px]" />
          <div className="relative w-[280px] h-[500px] rounded-[2.5rem] bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl z-20" />
            <div className="w-full h-full pt-8">
              {activeTab === "map" && <MapView />}
              {activeTab === "list" && <ListView />}
              {activeTab === "ar" && <ARView />}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
