"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { universities, University, IntelEvent, COLORS, EventCategory } from "./data";

// Dynamic import — globe.gl needs browser
const Globe = dynamic(() => import("react-globe.gl").then((m) => m.default), { ssr: false });

interface ArcData {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  stroke: number;
  dashGap: number;
  dashLength: number;
}

interface Props {
  events: IntelEvent[];
  activeFilters: Set<EventCategory>;
  onHoverUniversity: (uni: University | null, x: number, y: number) => void;
  arcs: ArcData[];
}

export function GlobeView({ events, activeFilters, onHoverUniversity, arcs }: Props) {
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Points = universities with activity
  const points = useMemo(() => {
    const eventMap = new Map<string, { count: number; category: EventCategory; severity: number }>();
    for (const evt of events) {
      const key = evt.university.name;
      const existing = eventMap.get(key);
      if (!existing || evt.severity > existing.severity) {
        eventMap.set(key, {
          count: (existing?.count || 0) + 1,
          category: evt.category,
          severity: evt.severity,
        });
      }
    }

    return universities
      .filter(() => activeFilters.size === 0 || true) // show all dots, color by most recent event
      .map((uni) => {
        const data = eventMap.get(uni.name);
        const category = data?.category || "academia";
        const show = activeFilters.size === 0 || activeFilters.has(category);
        return {
          lat: uni.lat,
          lng: uni.lng,
          name: uni.name,
          color: show ? COLORS[category] : "rgba(255,255,255,0.08)",
          size: data ? 0.15 + data.severity * 0.06 : 0.08,
          university: uni,
          hasEvent: !!data,
          altitude: data && data.severity >= 4 ? 0.02 : 0.005,
        };
      });
  }, [events, activeFilters]);

  // Set up globe on mount
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    // Initial camera position — show Americas
    globe.pointOfView({ lat: 30, lng: -40, altitude: 2.2 }, 0);

    // Auto-rotate
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 500;
    }

    setReady(true);
  }, []);

  const handlePointHover = useCallback((point: any) => {
    if (point) {
      // Get screen position (approximate)
      onHoverUniversity(point.university, 0, 0);
    } else {
      onHoverUniversity(null, 0, 0);
    }
  }, [onHoverUniversity]);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        animation: "gridPulse 8s ease-in-out infinite",
      }} />

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl=""
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#06B6D4"
        atmosphereAltitude={0.15}
        // Points
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude="altitude"
        pointsMerge={false}
        onPointHover={handlePointHover}
        // Arcs
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcStroke="stroke"
        arcDashLength="dashLength"
        arcDashGap="dashGap"
        arcDashAnimateTime={1500}
        arcAltitudeAutoScale={0.4}
        // Size
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
      />

      {/* Center glow effect */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Loading state */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#030308", zIndex: 50,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#06B6D4", letterSpacing: "0.2em", fontWeight: 700 }}>
              INITIALIZING
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
              Connecting to global intelligence network...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
