"use client";

interface PhoneMockupProps {
  label?: string;
  gradient?: string;
  icon?: string;
}

export default function PhoneMockup({
  label = "Colage",
  gradient = "from-[#A51C30] to-[#5A0F1A]",
  icon = "📍",
}: PhoneMockupProps) {
  return (
    <div className="relative">
      {/* Glow */}
      <div className={`absolute -inset-4 bg-gradient-to-br ${gradient} opacity-20 blur-3xl rounded-full`} />

      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] bg-[#1E1E1E] rounded-[3rem] border-[6px] border-[#2a2a2a] shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1E1E1E] rounded-b-2xl z-10" />

        {/* Screen content */}
        <div className={`h-full w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6`}>
          <span className="text-5xl mb-4">{icon}</span>
          <span className="text-white/80 text-sm font-medium tracking-wider uppercase">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
