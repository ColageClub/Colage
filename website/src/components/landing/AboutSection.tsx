"use client";

import FeatureSection from "./FeatureSection";
import PhoneMockup from "./PhoneMockup";

export default function AboutSection() {
  return (
    <FeatureSection
      id="about"
      subtitle="About Colage"
      title="Discover the people around you."
      description="Colage is a social discovery app built exclusively for verified college students and alumni. No DMs, no feeds, no noise — just real people near you, connected through their social links. Show up as yourself. Be You."
      visual={<PhoneMockup label="Discover" icon="🎓" gradient="from-[#A51C30] to-[#6B1520]" />}
    />
  );
}
