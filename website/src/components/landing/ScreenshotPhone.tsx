"use client";

import Image from "next/image";

export default function ScreenshotPhone({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ position: "relative" }}>
      {/* Glow */}
      <div style={{ position: "absolute", inset: -20, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", filter: "blur(30px)", borderRadius: "50%" }} />
      {/* Frame */}
      <div style={{
        position: "relative",
        width: 300,
        height: 620,
        background: "#000",
        borderRadius: 44,
        border: "6px solid #2a2a2a",
        boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}>
        {/* Notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 110, height: 26, background: "#000", borderRadius: "0 0 14px 14px", zIndex: 2 }} />
        {/* Screenshot */}
        <Image
          src={src}
          alt={alt}
          width={300}
          height={620}
          loading="lazy"
          quality={85}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>
    </div>
  );
}
