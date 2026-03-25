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
      <div className={`absolute -inset-8 bg-gradient-to-br ${gradient} opacity-15 blur-3xl rounded-full`} />

      {/* Phone frame */}
      <div className="relative w-[300px] h-[620px] md:w-[340px] md:h-[700px] lg:w-[380px] lg:h-[780px] bg-[#1E1E1E] rounded-[3rem] border-[6px] border-[#2a2a2a] shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1E1E1E] rounded-b-2xl z-10" />

        {/* Screen content */}
        <div className={`h-full w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-8`}>
          <span className="text-6xl md:text-7xl mb-6">{icon}</span>
          <span className="text-white/80 text-base md:text-lg font-medium tracking-wider uppercase">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
