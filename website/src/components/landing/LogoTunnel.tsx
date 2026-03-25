"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const UNIS = [
  { name: "MIT", color: "#A31F34" }, { name: "Stanford", color: "#8C1515" },
  { name: "Harvard", color: "#A51C30" }, { name: "Yale", color: "#00356B" },
  { name: "Princeton", color: "#E77500" }, { name: "Columbia", color: "#B9D9EB" },
  { name: "UPenn", color: "#011F5B" }, { name: "Brown", color: "#4E3629" },
  { name: "Cornell", color: "#B31B1B" }, { name: "Dartmouth", color: "#00693E" },
  { name: "Duke", color: "#003087" }, { name: "UChicago", color: "#800000" },
  { name: "UCLA", color: "#2774AE" }, { name: "USC", color: "#990000" },
  { name: "UMich", color: "#FFCB05" }, { name: "NYU", color: "#57068C" },
  { name: "Georgetown", color: "#041E42" }, { name: "UVA", color: "#232D4B" },
  { name: "GT", color: "#B3A369" }, { name: "UNC", color: "#4B9CD3" },
  { name: "Purdue", color: "#CEB888" }, { name: "OSU", color: "#BB0000" },
  { name: "Berkeley", color: "#003262" }, { name: "UW", color: "#4B2E83" },
  { name: "UT", color: "#BF5700" }, { name: "MSU", color: "#18453B" },
  { name: "ND", color: "#0C2340" }, { name: "BC", color: "#98002E" },
  { name: "Iowa", color: "#FFCD00" }, { name: "UF", color: "#0021A5" },
  { name: "LSU", color: "#461D7C" }, { name: "Auburn", color: "#0C2340" },
  { name: "ASU", color: "#8C1D40" }, { name: "Clemson", color: "#F56600" },
  { name: "Baylor", color: "#003015" }, { name: "Rice", color: "#00205B" },
  { name: "Emory", color: "#012169" }, { name: "Tufts", color: "#3E8EDE" },
  { name: "WashU", color: "#A51417" }, { name: "Vandy", color: "#866D4B" },
];

function makeTexture(text: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.font = "bold 36px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.55;
  ctx.fillText(text, 128, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function Logos() {
  const meshRefs = useRef<THREE.Mesh[]>([]);

  const particles = useMemo(() =>
    UNIS.map((u, i) => {
      const angle = (i / UNIS.length) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 3 + Math.random() * 5;
      return {
        pos: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -Math.random() * 40),
        vel: 0.02 + Math.random() * 0.03,
        tex: makeTexture(u.name, u.color),
        opacity: 0.6 + Math.random() * 0.4,
        scale: 0.8 + Math.random() * 0.6,
      };
    }), []);

  useFrame((_, dt) => {
    particles.forEach((p, i) => {
      p.pos.z += p.vel * 60 * dt;
      if (p.pos.z > 2) {
        p.pos.z = -35 - Math.random() * 10;
        const a = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 5;
        p.pos.x = Math.cos(a) * r;
        p.pos.y = Math.sin(a) * r;
      }
      const m = meshRefs.current[i];
      if (m) {
        m.position.copy(p.pos);
        const d = Math.max(0, 1 - Math.abs(p.pos.z) / 40);
        m.scale.setScalar(p.scale * (0.3 + d * 1.2));
        (m.material as THREE.MeshBasicMaterial).opacity = p.opacity * (0.1 + d * 0.9);
      }
    });
  });

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) meshRefs.current[i] = el; }} position={p.pos}>
          <planeGeometry args={[2.5, 1.25]} />
          <meshBasicMaterial map={p.tex} transparent opacity={p.opacity} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function LogoTunnel() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={1} />
        <Logos />
      </Canvas>
    </div>
  );
}
