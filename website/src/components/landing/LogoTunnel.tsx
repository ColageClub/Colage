"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// University data — name + brand color
const UNIVERSITIES = [
  { name: "MIT", color: "#A31F34" },
  { name: "Stanford", color: "#8C1515" },
  { name: "Harvard", color: "#A51C30" },
  { name: "Yale", color: "#00356B" },
  { name: "Princeton", color: "#E77500" },
  { name: "Columbia", color: "#B9D9EB" },
  { name: "UPenn", color: "#011F5B" },
  { name: "Brown", color: "#4E3629" },
  { name: "Cornell", color: "#B31B1B" },
  { name: "Dartmouth", color: "#00693E" },
  { name: "Duke", color: "#003087" },
  { name: "UChicago", color: "#800000" },
  { name: "UCLA", color: "#2774AE" },
  { name: "USC", color: "#990000" },
  { name: "UMich", color: "#FFCB05" },
  { name: "NYU", color: "#57068C" },
  { name: "Georgetown", color: "#041E42" },
  { name: "UVA", color: "#232D4B" },
  { name: "GT", color: "#B3A369" },
  { name: "UNC", color: "#4B9CD3" },
  { name: "Purdue", color: "#CEB888" },
  { name: "OSU", color: "#BB0000" },
  { name: "Berkeley", color: "#003262" },
  { name: "UW", color: "#4B2E83" },
  { name: "UT", color: "#BF5700" },
  { name: "MSU", color: "#18453B" },
  { name: "ND", color: "#0C2340" },
  { name: "BC", color: "#98002E" },
  { name: "Iowa", color: "#FFCD00" },
  { name: "UF", color: "#0021A5" },
  { name: "LSU", color: "#461D7C" },
  { name: "Auburn", color: "#0C2340" },
  { name: "ASU", color: "#8C1D40" },
  { name: "Clemson", color: "#F56600" },
  { name: "Baylor", color: "#003015" },
  { name: "Rice", color: "#00205B" },
  { name: "Emory", color: "#012169" },
  { name: "Tufts", color: "#3E8EDE" },
  { name: "WashU", color: "#A51417" },
  { name: "Vandy", color: "#866D4B" },
];

function createTextTexture(text: string, color: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 256, 128);
  ctx.font = "bold 36px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface LogoParticle {
  position: THREE.Vector3;
  velocity: number;
  texture: THREE.Texture;
  opacity: number;
  scale: number;
  angle: number;
  radius: number;
}

function Logos() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const { viewport } = useThree();

  const particles = useMemo<LogoParticle[]>(() => {
    return UNIVERSITIES.map((uni, i) => {
      const angle = (i / UNIVERSITIES.length) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 3 + Math.random() * 5;
      const z = -Math.random() * 40;
      return {
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z
        ),
        velocity: 0.02 + Math.random() * 0.03,
        texture: createTextTexture(uni.name, uni.color),
        opacity: 0.6 + Math.random() * 0.4,
        scale: 0.8 + Math.random() * 0.6,
        angle,
        radius,
      };
    });
  }, []);

  useFrame((_, delta) => {
    particles.forEach((p, i) => {
      p.position.z += p.velocity * 60 * delta;

      // When logo passes the camera, reset to far back
      if (p.position.z > 2) {
        p.position.z = -35 - Math.random() * 10;
        p.angle = Math.random() * Math.PI * 2;
        p.radius = 3 + Math.random() * 5;
        p.position.x = Math.cos(p.angle) * p.radius;
        p.position.y = Math.sin(p.angle) * p.radius;
      }

      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.copy(p.position);
        // Scale up as they get closer
        const distFactor = Math.max(0, 1 - Math.abs(p.position.z) / 40);
        mesh.scale.setScalar(p.scale * (0.3 + distFactor * 1.2));
        // Fade based on distance
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = p.opacity * (0.1 + distFactor * 0.9);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={p.position}
        >
          <planeGeometry args={[2.5, 1.25]} />
          <meshBasicMaterial
            map={p.texture}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function LogoTunnel() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1} />
        <Logos />
      </Canvas>
    </div>
  );
}
