"use client";

import FeatureSection from "./FeatureSection";
import PhoneMockup from "./PhoneMockup";

export default function MapSection() {
  return (
    <FeatureSection
      id="map"
      badge="Map Discovery"
      title="See who's around you in real time."
      description="An interactive map shows every visible student near you. Tap a profile to see their bio, major, and social links. Floor-by-floor filtering means you can find people in the same building, same floor — right next to you."
      visual={
        <PhoneMockup
          label="Map View"
          icon="🗺️"
          gradient="from-[#003262] to-[#00274C]"
        />
      }
      reversed
    />
  );
}
