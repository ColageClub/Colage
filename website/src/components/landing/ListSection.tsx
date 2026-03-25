"use client";

import FeatureSection from "./FeatureSection";
import PhoneMockup from "./PhoneMockup";

export default function ListSection() {
  return (
    <FeatureSection
      id="list"
      badge="List Discovery"
      title="Browse your campus."
      description="A clean two-column grid of student profiles, sorted by distance. Drag the radius slider to expand your search from 10 feet to 500 feet. Every profile shows their photo, name, major, and social links at a glance."
      visual={
        <PhoneMockup
          label="List View"
          icon="📋"
          gradient="from-[#4B2E83] to-[#2D1A4E]"
        />
      }
    />
  );
}
