"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 1982, label: "Students", suffix: "" },
  { value: 3, label: "Campuses", suffix: "" },
  { value: 847, label: "Online Now", suffix: "" },
  { value: 98, label: "Satisfaction", suffix: "%" },
];

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

export function StatsCounter() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat) => {
        const { count, ref } = useCountUp(stat.value);
        return (
          <div key={stat.label} ref={ref} className="text-center">
            <div className="text-4xl lg:text-5xl font-black gradient-text">
              {count.toLocaleString()}{stat.suffix}
            </div>
            <div className="text-sm text-[#A0A0A0] mt-2 font-medium">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
