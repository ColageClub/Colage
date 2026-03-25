"use client";
import { FeatureRow } from "./Section";
import PhoneMockup from "./PhoneMockup";

export default function ARSection() {
  return (
    <FeatureRow
      id="ar"
      badge="AR Discovery"
      title="Discover in augmented reality."
      description="Hold up your phone and see student profiles floating in the world around you. AR mode uses your camera and location to place name cards in 3D space — the most immersive way to discover who's nearby."
      visual={<PhoneMockup label="AR Mode" icon="👁️" gradient="linear-gradient(135deg, #BF5700, #7A3600)" />}
      reversed
    />
  );
}
