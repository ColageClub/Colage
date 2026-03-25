"use client";
import { FeatureRow } from "./Section";
import ScreenshotPhone from "./ScreenshotPhone";

export default function MapSection() {
  return (
    <FeatureRow
      id="map"
      badge="Map Discovery"
      title="See who's around you in real time."
      description="An interactive map shows every visible student near you. Tap a profile to see their bio, major, and social links. Floor-by-floor filtering means you can find people in the same building, same floor — right next to you."
      visual={<ScreenshotPhone src="/screenshots/map.png" alt="Colage map view showing students on University of Michigan campus" />}
      reversed
    />
  );
}
