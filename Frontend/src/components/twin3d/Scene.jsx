import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import Earth from "./Earth";
import Satellite from "./Satellite";
import { getPositionAtTime } from "@/lib/orbit";
import { getStationECIPosition } from "@/lib/groundContact";
import { groundStations } from "@/data/groundStations";

function ConstellationInner({ latest }) {
  const satelliteGroupRef = useRef();
  const orbitLineRef = useRef();
  const groundStationRef = useRef();

  const met = latest?.met ?? 128400;

  // 1. Get current satellite position in ECI
  const satPos = useMemo(() => {
    return getPositionAtTime(met);
  }, [met]);

  // 2. Get Svalbard Ground Station ECI position
  const svalbardGS = groundStations[0]; // SGS
  const svalbardPos = useMemo(() => {
    return getStationECIPosition(svalbardGS, met);
  }, [met]);

  // 3. Define Sun direction vector in ECI
  // Eclipse range is 205 to 320 degrees, meaning center of shadow is 262.5 deg.
  // Sun is opposite to shadow center, i.e., 82.5 deg.
  const sunDirection = useMemo(() => {
    const angleRad = (82.5 * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
  }, []);

  const sunPos = useMemo(() => {
    return sunDirection.clone().multiplyScalar(5.5); // position at the edge
  }, [sunDirection]);

  // 4. Update scene positions on frame tick
  useFrame(() => {
    // Positioning satellite group
    if (satelliteGroupRef.current) {
      satelliteGroupRef.current.position.set(satPos[0], satPos[1], satPos[2]);
    }

    // Positioning ground station mesh
    if (groundStationRef.current) {
      groundStationRef.current.position.set(svalbardPos[0], svalbardPos[1], svalbardPos[2]);
    }

    // Dynamic J2-perturbed orbit line rendering
    if (orbitLineRef.current) {
      const points = [];
      const period = 5954; // orbital period in seconds
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const checkT = met - period + (i * period) / steps;
        const p = getPositionAtTime(checkT);
        points.push(new THREE.Vector3(p[0], p[1], p[2]));
      }
      orbitLineRef.current.geometry.setFromPoints(points);
    }
  });

  return (
    <group>
      {/* Dynamic trajectory line */}
      <line ref={orbitLineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#1f6f78" transparent opacity={0.6} />
      </line>

      {/* Earth globe */}
      <Earth />

      {/* Reference Ground Station (Svalbard) */}
      <mesh ref={groundStationRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#f0a83b" />
        <Html distanceFactor={4} center>
          <div className="font-mono text-[8px] font-bold text-[#f0a83b] bg-black/90 border border-[#f0a83b]/30 px-1 py-px rounded-xs whitespace-nowrap pointer-events-none shadow-[0_0_8px_rgba(240,168,59,0.4)] uppercase">
            Svalbard (SGS)
          </div>
        </Html>
      </mesh>

      {/* Satellite (ARGUS-7) */}
      <group ref={satelliteGroupRef}>
        <group scale={0.06} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
          <Satellite selectedSubsystem={null} setSelectedSubsystem={() => {}} />
        </group>
        <Html distanceFactor={4} center position={[0, 0.35, 0]}>
          <div className="font-mono text-[8px] font-bold text-[#4fd8c8] bg-black/90 border border-[#4fd8c8]/30 px-1 py-px rounded-xs whitespace-nowrap pointer-events-none shadow-[0_0_8px_rgba(79,216,200,0.4)] uppercase">
            ARGUS-7
          </div>
        </Html>
      </group>

      {/* Sun Vector Indicator at the edge */}
      <group position={sunPos}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        <pointLight color="#fff4e0" intensity={1.8} distance={15} decay={1.5} />
        <Html distanceFactor={5} center position={[0, 0.25, 0]}>
          <div className="font-mono text-[8px] font-bold text-[#ffcc00] bg-black/90 border border-[#ffcc00]/30 px-1 py-px rounded-xs whitespace-nowrap pointer-events-none shadow-[0_0_8px_rgba(255,204,0,0.5)] uppercase">
            Sun
          </div>
        </Html>
      </group>
    </group>
  );
}

export default function Scene({ latest, status }) {
  return (
    <div className="relative w-full h-[200px] bg-black overflow-hidden select-none">
      <Canvas
        camera={{ position: [3.8, 2.2, 4.2], fov: 40 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.25} />
        
        {/* Soft backlighting */}
        <pointLight position={[-4, -2, -4]} intensity={0.4} color="#1f6f78" />

        <Suspense fallback={null}>
          <Stars radius={70} depth={30} count={600} factor={3} saturation={0} fade speed={0.5} />
        </Suspense>

        <Suspense fallback={null}>
          <ConstellationInner latest={latest} />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2.5}
          maxDistance={9}
          autoRotate
          autoRotateSpeed={0.35}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
