"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlobeView } from "./GlobeView";
import { CommandBar } from "./CommandBar";
import { AcademiaPanel } from "./AcademiaPanel";
import { SportsPanel } from "./SportsPanel";
import { StudentPanel } from "./StudentPanel";
import { generateEvent, generateInitialEvents, IntelEvent, EventCategory, COLORS, University } from "./data";

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

// Panel target coordinates for arcs (approximate screen-edge positions on globe)
const panelTargets: Record<string, { lat: number; lng: number }> = {
  academia: { lat: 50, lng: -120 },  // left
  sports: { lat: 50, lng: 40 },      // right
  students: { lat: -30, lng: -40 },  // bottom
  trending: { lat: -30, lng: -40 },  // bottom
};

export function CommandCenter() {
  const [events, setEvents] = useState<IntelEvent[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(new Set());
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [hoveredUni, setHoveredUni] = useState<University | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const eventRef = useRef(events);
  eventRef.current = events;

  // Initialize
  useEffect(() => {
    const initial = generateInitialEvents(30);
    setEvents(initial);
    setEventCount(initial.length);
  }, []);

  // Auto-generate events every 3-8 seconds
  useEffect(() => {
    function tick() {
      const evt = generateEvent();
      setEvents((prev) => [evt, ...prev].slice(0, 100)); // cap at 100
      setEventCount((c) => c + 1);
      setFlashId(evt.id);

      // Create arc from university to panel target
      const target = panelTargets[evt.category];
      const arc: ArcData = {
        id: evt.id,
        startLat: evt.university.lat,
        startLng: evt.university.lng,
        endLat: target.lat,
        endLng: target.lng,
        color: COLORS[evt.category],
        stroke: 0.3 + evt.severity * 0.4,
        dashLength: 0.4,
        dashGap: 0.2,
      };
      setArcs((prev) => [...prev, arc]);

      // Remove arc after animation
      setTimeout(() => {
        setArcs((prev) => prev.filter((a) => a.id !== arc.id));
      }, 3000);

      // Clear flash
      setTimeout(() => setFlashId(null), 1500);

      // Schedule next
      const delay = 3000 + Math.random() * 5000;
      const timer = setTimeout(tick, delay);
      return timer;
    }

    const initialDelay = setTimeout(tick, 2000);
    return () => clearTimeout(initialDelay);
  }, []);

  const handleToggleFilter = useCallback((cat: EventCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handlePulse = useCallback(() => {
    // Burst: generate 5 high-severity events
    const burst: IntelEvent[] = [];
    for (let i = 0; i < 5; i++) {
      const evt = generateEvent();
      evt.severity = 4 + Math.round(Math.random());
      burst.push(evt);
    }
    setEvents((prev) => [...burst, ...prev].slice(0, 100));
    setEventCount((c) => c + 5);

    // Create arcs for all burst events
    burst.forEach((evt, i) => {
      setTimeout(() => {
        const target = panelTargets[evt.category];
        const arc: ArcData = {
          id: evt.id,
          startLat: evt.university.lat,
          startLng: evt.university.lng,
          endLat: target.lat,
          endLng: target.lng,
          color: COLORS[evt.category],
          stroke: 1 + evt.severity * 0.3,
          dashLength: 0.6,
          dashGap: 0.1,
        };
        setArcs((prev) => [...prev, arc]);
        setFlashId(evt.id);
        setTimeout(() => setArcs((prev) => prev.filter((a) => a.id !== arc.id)), 3000);
      }, i * 300);
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    // Future: filter globe dots and events
  }, []);

  const handleHoverUni = useCallback((uni: University | null) => {
    setHoveredUni(uni);
  }, []);

  const filteredEvents = activeFilters.size === 0
    ? events
    : events.filter((e) => activeFilters.has(e.category));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#030308", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
      {/* CSS animations */}
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        @keyframes panelFlash {
          0% { background: rgba(59,130,246,0.3); }
          100% { background: rgba(59,130,246,0.05); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Globe */}
      <GlobeView
        events={filteredEvents}
        activeFilters={activeFilters}
        onHoverUniversity={handleHoverUni}
        arcs={arcs}
      />

      {/* Command Bar (top, auto-hide) */}
      <CommandBar
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onPulse={handlePulse}
        onSearch={handleSearch}
      />

      {/* Side Panels */}
      <AcademiaPanel events={filteredEvents} flashId={flashId} />
      <SportsPanel events={filteredEvents} flashId={flashId} />
      <StudentPanel events={filteredEvents} flashId={flashId} />

      {/* Hover Card */}
      {hoveredUni && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -120%)",
          background: "rgba(3,3,8,0.9)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(6,182,212,0.3)", borderRadius: 12,
          padding: 16, zIndex: 50, minWidth: 220,
          animation: "fadeIn 0.2s ease",
          boxShadow: "0 0 30px rgba(6,182,212,0.1)",
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", color: "#06B6D4", textTransform: "uppercase", marginBottom: 6 }}>
            Intelligence Brief
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{hoveredUni.name}</h3>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {hoveredUni.country} · {hoveredUni.students.toLocaleString()} students
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            {filteredEvents.filter((e) => e.university.name === hoveredUni.name).length} active signals
          </div>
        </div>
      )}

      {/* Status bar — bottom right */}
      <div style={{
        position: "fixed", bottom: 12, right: 340, zIndex: 20,
        display: "flex", gap: 16, fontSize: 10, color: "rgba(255,255,255,0.25)",
      }}>
        <span>⚡ {eventCount} events tracked</span>
        <span>🌐 {Math.round(120)} universities monitored</span>
        <span style={{ color: "#22C55E" }}>● LIVE</span>
      </div>
    </div>
  );
}
