"use client";

import { useEffect, useState, useRef } from "react";

function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          const startTime = Date.now();

          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * eased));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, start]);

  return { count, ref };
}

export function StatsCounter() {
  const students = useCountUp(1982);
  const schools = useCountUp(3);
  const connections = useCountUp(12847);
  const uptime = useCountUp(99);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { ref: students.ref, value: students.count.toLocaleString(), label: "Students", suffix: "", gradient: "from-[#6C5CE7] to-[#a29bfe]" },
        { ref: schools.ref, value: schools.count.toString(), label: "Universities", suffix: "", gradient: "from-[#00b894] to-[#00CEC9]" },
        { ref: connections.ref, value: connections.count.toLocaleString(), label: "Profile Views", suffix: "", gradient: "from-[#FFCB05] to-[#fdcb6e]" },
        { ref: uptime.ref, value: uptime.count.toString(), label: "Uptime", suffix: "%", gradient: "from-[#a29bfe] to-[#6C5CE7]" },
      ].map((stat) => (
        <div
          key={stat.label}
          ref={stat.ref}
          className="relative p-8 rounded-3xl bg-white/2 border border-white/5 text-center group hover:bg-white/5 hover:border-white/10 transition-all duration-500"
        >
          <div className={`text-4xl lg:text-5xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
            {stat.value}{stat.suffix}
          </div>
          <div className="text-sm text-white/30 mt-2 font-medium">{stat.label}</div>
          {/* Bottom accent line */}
          <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
        </div>
      ))}
    </div>
  );
}
