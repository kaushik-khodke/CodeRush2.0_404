import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { AdcsFrame } from "@/lib/smoa/types";
import { getPositionAtTime } from "@/lib/orbit";
import Satellite from "@/components/twin3d/Satellite";

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

  const frame = attitude?.current as any;
  const isCritical = frame?.power?.busVoltage !== undefined
    ? frame.power.busVoltage < 21.0
    : (frame?.anomalyScore !== undefined && frame.anomalyScore > 0.5);


  return (
    <group ref={group}>
      {/* High-definition 3D Satellite with Space-Grade Gold MLI & Solar Cell Textures */}
      <group scale={1.15}>
        <Satellite
          batteryStatus={isCritical ? "CRITICAL" : showThermalHeatmap && cpuTemp > 50 ? "CAUTION" : "NOMINAL"}
          panelBStatus="NOMINAL"
        />
      </group>


      {/* ☀️ Sun Vector Visualizer */}
      {showSunVector && (
        <group position={[0, 1.8, 2.2]}>
          <cylinderGeometry args={[0.02, 0.02, 3.0, 8]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.85} />
        </group>
      )}

      {/* 📷 Payload Ground Sensor Cone */}
      {showSensorCone && (
        <mesh position={[0, -2.8, 0]}>
          <coneGeometry args={[1.4, 3.6, 32, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Body axes */}
      <axesHelper args={[2.4]} />
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
  const radius = 4.2;

  useFrame(() => {
    const m = marker.current;
    const l = lineRef.current;
    if (!m) return;

    if (metRef?.current) {
      // J2-perturbed orbit coordinates
      const t = metRef.current;
      const pos = getPositionAtTime(t);
      m.position.set(pos[0] * 1.1, pos[1] * 1.1, pos[2] * 1.1);

      if (l) {
        const points: THREE.Vector3[] = [];
        const period = 5954;
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const checkT = t - period + (i * period) / steps;
          const p = getPositionAtTime(checkT);
          points.push(new THREE.Vector3(p[0] * 1.1, p[1] * 1.1, p[2] * 1.1));
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
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </line>
      {/* Active satellite position indicator */}
      <mesh ref={marker}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color="#ffb703" />
      </mesh>
      {/* Central Earth wireframe reference */}
      <mesh>
        <sphereGeometry args={[1.8, 36, 36]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.8} wireframe />
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
    <Canvas camera={{ position: [5.8, 3.4, 7.2], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[7, 6, 5]} intensity={2.4} color="#fff4e0" />
      <directionalLight position={[-6, -3, -5]} intensity={0.6} color="#0284c7" />
      <pointLight position={[0, 4, -4]} intensity={0.8} color="#38bdf8" />
      <Suspense fallback={null}>
        <Stars radius={90} depth={45} count={4000} factor={3.5} saturation={0} fade speed={0.5} />
      </Suspense>
      <Spacecraft
        attitude={attitude}
        showSunVector={showSunVector}
        showSensorCone={showSensorCone}
        showThermalHeatmap={showThermalHeatmap}
        cpuTemp={cpuTemp}
      />
      <OrbitTrack angleRef={orbitAngle} metRef={metRef} />
      <OrbitControls enablePan={false} minDistance={4.5} maxDistance={18} autoRotate autoRotateSpeed={0.25} />
    </Canvas>
  );
}
