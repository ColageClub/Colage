"use client";
import { FeatureRow } from "./Section";
import ScreenshotPhone from "./ScreenshotPhone";

export default function AboutSection() {
  return (
    <FeatureRow
      id="about"
      badge="About Colage"
      title="Discover the people around you."
      description="Colage is a social discovery app built exclusively for verified college students. No DMs, no feeds, no noise — just real people near you on campus, connected through their social links. Show up as yourself. Be You."
      visual={<ScreenshotPhone src="/screenshots/map.png" alt="Colage app showing students nearby on campus map" />}
    />
  );
}
