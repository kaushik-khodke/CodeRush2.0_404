import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { AdcsFrame } from "@/lib/smoa/types";
import { getPositionAtTime } from "@/lib/orbit";

const DEG = Math.PI / 180;

function Spacecraft({
  attitude,
  showSunVector = true,
  showSensorCone = true,
  showThermalHeatmap = false,
  cpuTemp = 35.0,
}: {
  attitude: React.RefObject<AdcsFrame | null> | null;
  showSunVector?: boolean;
  showSensorCone?: boolean;
  showThermalHeatmap?: boolean;
  cpuTemp?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const g = group.current;
    const a = attitude?.current;
    if (!g || !a) return;

    // Damped follow so the model tracks telemetry without visual snapping.
    const target = new THREE.Euler(a.pitch * DEG, a.yaw * DEG, a.roll * DEG, "YXZ");
    const q = new THREE.Quaternion().setFromEuler(target);
    g.quaternion.slerp(q, Math.min(1, delta * 4));
  });

  // Calculate dynamic thermal heatmap color
  const bodyColor = showThermalHeatmap
    ? cpuTemp > 65.0
      ? "#E54D42"
      : cpuTemp > 48.0
      ? "#D9A441"
      : "#1F6F78"
    : "#8A9099";

  return (
    <group ref={group}>
      {/* Bus */}
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.4, 1.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.14, 0.28, 1.14]} />
        <meshStandardMaterial color="#1F6F78" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Solar arrays */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.95, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.6, 0.04, 1.0]} />
            <meshStandardMaterial color="#16303B" metalness={0.4} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[2.5, 0.01, 0.9]} />
            <meshStandardMaterial color="#1F6F78" emissive="#123A40" metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[-s * 1.35, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 12]} />
            <meshStandardMaterial color="#6B717A" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* High-gain antenna */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 0.34, 24, 1, true]} />
        <meshStandardMaterial color="#D3D6DA" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Payload optics */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.5, 20]} />
        <meshStandardMaterial color="#2B2F36" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ☀️ Sun Vector Visualizer */}
      {showSunVector && (
        <group position={[0, 1.5, 2.0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.5, 8]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.8} />
        </group>
      )}

      {/* 📷 Payload Ground Sensor Cone */}
      {showSensorCone && (
        <mesh position={[0, -2.5, 0]}>
          <coneGeometry args={[1.2, 3.0, 32, 1, true]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Body axes */}
      <axesHelper args={[2.2]} />
    </group>
  );
}

function OrbitTrack({
  angleRef,
  metRef,
}: {
  angleRef: React.RefObject<number | null> | null;
  metRef?: React.RefObject<number> | null;
}) {
  const marker = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);
  const radius = 3.6;

  useFrame(() => {
    const m = marker.current;
    const l = lineRef.current;
    if (!m) return;

    if (metRef?.current) {
      // J2-perturbed orbit coordinates
      const t = metRef.current;
      const pos = getPositionAtTime(t);
      m.position.set(pos[0], pos[1], pos[2]);

      if (l) {
        const points: THREE.Vector3[] = [];
        const period = 5954;
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const checkT = t - period + (i * period) / steps;
          const p = getPositionAtTime(checkT);
          points.push(new THREE.Vector3(p[0], p[1], p[2]));
        }
        l.geometry.setFromPoints(points);
      }
    } else {
      // Simplified circular orbit path fallback
      const a = (angleRef?.current ?? 0) * DEG;
      m.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);

      if (l) {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          const theta = (i * 2 * Math.PI) / 64;
          points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        l.geometry.setFromPoints(points);
      }
    }
  });

  return (
    <group>
      {/* Dynamic trajectory line */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#1F6F78" transparent opacity={0.55} />
      </line>
      {/* Active satellite position indicator */}
      <mesh ref={marker}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#D9A441" />
      </mesh>
      {/* Central Earth wireframe reference */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#20323A" metalness={0.1} roughness={0.9} wireframe />
      </mesh>
    </group>
  );
}

export default function AttitudeScene({
  attitude,
  orbitAngle,
  metRef,
  showSunVector = true,
  showSensorCone = true,
  showThermalHeatmap = false,
  cpuTemp = 35.0,
}: {
  attitude: React.RefObject<AdcsFrame | null> | null;
  orbitAngle: React.RefObject<number | null> | null;
  metRef?: React.RefObject<number> | null;
  showSunVector?: boolean;
  showSensorCone?: boolean;
  showThermalHeatmap?: boolean;
  cpuTemp?: number;
}) {
  return (
    <Canvas camera={{ position: [5.5, 3.2, 6.5], fov: 42 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#14171A"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 5, 4]} intensity={2.1} color="#FFF4E0" />
      <directionalLight position={[-5, -2, -4]} intensity={0.35} color="#1F6F78" />
      <Suspense fallback={null}>
        <Stars radius={90} depth={45} count={2600} factor={3.2} saturation={0} fade speed={0.4} />
      </Suspense>
      <Spacecraft
        attitude={attitude}
        showSunVector={showSunVector}
        showSensorCone={showSensorCone}
        showThermalHeatmap={showThermalHeatmap}
        cpuTemp={cpuTemp}
      />
      <OrbitTrack angleRef={orbitAngle} metRef={metRef} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={16} autoRotate autoRotateSpeed={0.25} />
    </Canvas>
  );
}
