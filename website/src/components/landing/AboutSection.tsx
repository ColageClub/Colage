"use client";
import { FeatureRow } from "./Section";
import PhoneMockup from "./PhoneMockup";

export default function AboutSection() {
  return (
    <FeatureRow
      id="about"
      badge="About Colage"
      title="Discover the people around you."
      description="Colage is a social discovery app built exclusively for verified college students and alumni. No DMs, no feeds, no noise — just real people near you, connected through their social links. Show up as yourself. Be You."
      visual={<PhoneMockup label="Discover" icon="🎓" gradient="linear-gradient(135deg, #A51C30, #6B1520)" />}
    />
  );
}
