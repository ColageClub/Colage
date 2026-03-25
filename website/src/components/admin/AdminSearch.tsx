"use client";

import { useState, useEffect, useRef } from "react";

interface AdminSearchProps {
  placeholder?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export default function AdminSearch({
  placeholder = "Search...",
  onChange,
  debounceMs = 300,
}: AdminSearchProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onChange(value), debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [value, debounceMs, onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#6C5CE7] transition-colors"
      />
    </div>
  );
}
