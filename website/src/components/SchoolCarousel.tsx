"use client";

import { useState } from "react";

const schools = [
  {
    name: "University of Michigan",
    domain: "umich.edu",
    color: "#FFCB05",
    textColor: "#00274C",
    students: 847,
    emoji: "〽️",
    tagline: "Go Blue!",
  },
  {
    name: "Harvard University",
    domain: "harvard.edu",
    color: "#A51C30",
    textColor: "#ffffff",
    students: 612,
    emoji: "🎓",
    tagline: "Veritas",
  },
  {
    name: "Stanford University",
    domain: "stanford.edu",
    color: "#8C1515",
    textColor: "#ffffff",
    students: 523,
    emoji: "🌲",
    tagline: "The Farm",
  },
  {
    name: "Your School",
    domain: "your.edu",
    color: "#6C5CE7",
    textColor: "#ffffff",
    students: 0,
    emoji: "🏫",
    tagline: "Be the first",
  },
];

export function SchoolCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {schools.map((school, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={school.domain}
              onClick={() => setActiveIndex(i)}
              className={`relative p-6 rounded-2xl border text-left transition-all duration-500 overflow-hidden ${
                isActive
                  ? "shadow-lg scale-[1.02]"
                  : "hover:scale-[1.01] bg-white"
              }`}
              style={{
                borderColor: isActive ? school.color + "40" : "#e5e3f0",
                backgroundColor: isActive ? school.color + "08" : undefined,
              }}
            >
              {/* Decorative corner */}
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] opacity-10"
                style={{ backgroundColor: school.color }}
              />

              <div className="relative z-10">
                <div className="text-3xl mb-3">{school.emoji}</div>
                <div className="font-bold text-[#1a1a2e] text-sm leading-tight">{school.name}</div>
                <div className="text-[10px] text-[#9090a8] mt-1">{school.domain}</div>

                <div className="mt-4 flex items-center gap-2">
                  {school.students > 0 ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00b894]" />
                      <span className="text-[11px] font-semibold" style={{ color: school.color }}>
                        {school.students} students
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#6C5CE7]">
                      {school.tagline}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded detail */}
      <div
        className="p-8 rounded-2xl border transition-all duration-500"
        style={{
          borderColor: schools[activeIndex].color + "30",
          backgroundColor: schools[activeIndex].color + "05",
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-6xl">{schools[activeIndex].emoji}</div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-black text-[#1a1a2e]">{schools[activeIndex].name}</h3>
            <p className="text-[#5a5a7a] mt-1">
              {schools[activeIndex].students > 0
                ? `${schools[activeIndex].students} students discovering their campus with Colage`
                : "Your school could be next. Sign up with your .edu email to bring Colage to your campus."}
            </p>
          </div>
          <div
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: schools[activeIndex].color,
              color: schools[activeIndex].textColor,
            }}
          >
            {schools[activeIndex].students > 0 ? "Join Now" : "Request Access"}
          </div>
        </div>
      </div>
    </div>
  );
}
