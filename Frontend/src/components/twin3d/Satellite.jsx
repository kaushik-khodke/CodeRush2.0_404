import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Subsystem visual status colors matching index.css themes
const COLORS = {
  NOMINAL: '#57c67a',  // var(--accent-green)
  CAUTION: '#f0a83b',  // var(--accent-amber)
  CRITICAL: '#ef5350', // var(--accent-red)
  DEFAULT_METAL: '#2c3b4d', // var(--line-bright)
  BLUE_SOLAR: '#1a365d',
  SOLAR_CELLS: '#1e3a8a',
  CYAN: '#4fd8c8',
  VIOLET: '#8b8fff',
};

export default function Satellite({
  selectedSubsystem,
  setSelectedSubsystem,
  panelBStatus = 'NOMINAL',
  batteryStatus = 'NOMINAL',
}) {
  const satelliteRef = useRef();

  // Slow idle rotation on the satellite body
  useFrame((state, delta) => {
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y += 0.2 * delta;
      // Slight pitch oscillation for idle floating effect
      satelliteRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  // Calculate dynamic colors based on status and selection
  const bodyColor = selectedSubsystem === 'battery'
    ? COLORS.CYAN
    : (batteryStatus === 'NOMINAL' ? COLORS.DEFAULT_METAL : COLORS.CAUTION);

  const panelAColor = selectedSubsystem === 'panelA'
    ? COLORS.CYAN
    : COLORS.BLUE_SOLAR;

  const panelBColor = selectedSubsystem === 'panelB'
    ? COLORS.CYAN
    : (panelBStatus === 'NOMINAL' ? COLORS.BLUE_SOLAR : COLORS.CAUTION);

  const antennaColor = selectedSubsystem === 'antenna'
    ? COLORS.VIOLET
    : COLORS.DEFAULT_METAL;

  return (
    <group ref={satelliteRef}>
      {/* 1. Main Satellite Bus / Chassis (Battery Subsystem) */}
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem('battery');
        }}
      >
        <boxGeometry args={[1.2, 1.2, 1.6]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Internal Battery Core Indicator (smaller box nested inside) */}
      <mesh position={[0, 0, 0.81]}>
        <boxGeometry args={[0.6, 0.4, 0.02]} />
        <meshStandardMaterial
          color={batteryStatus === 'NOMINAL' ? COLORS.NOMINAL : COLORS.CAUTION}
          emissive={batteryStatus === 'NOMINAL' ? COLORS.NOMINAL : COLORS.CAUTION}
          emissiveIntensity={batteryStatus === 'NOMINAL' ? 0.3 : 1.0}
        />
      </mesh>

      {/* 2. Solar Array Connectors (cylinder bars) */}
      {/* Left panel connector */}
      <mesh position={[-1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right panel connector */}
      <mesh position={[1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3. Solar Array Panel A (Left) */}
      <group
        position={[-2.0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem('panelA');
        }}
      >
        {/* Main Panel Structure */}
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.04, 2.2]} />
          <meshStandardMaterial
            color={panelAColor}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        {/* Solar grid pattern details */}
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[1.5, 0.01, 2.1]} />
          <meshStandardMaterial
            color={COLORS.SOLAR_CELLS}
            roughness={0.1}
            metalness={0.9}
            wireframe
          />
        </mesh>
      </group>

      {/* 4. Solar Array Panel B (Right) */}
      <group
        position={[2.0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem('panelB');
        }}
      >
        {/* Main Panel Structure */}
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.04, 2.2]} />
          <meshStandardMaterial
            color={panelBColor}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        {/* Solar grid pattern details */}
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[1.5, 0.01, 2.1]} />
          <meshStandardMaterial
            color={panelBStatus === 'NOMINAL' ? COLORS.SOLAR_CELLS : COLORS.CAUTION}
            roughness={0.1}
            metalness={0.9}
            wireframe
          />
        </mesh>
      </group>

      {/* 5. Comms Mast & High Gain Antenna Dish (Top) */}
      <group position={[0, 0.9, 0]}>
        {/* Mast */}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.6]} />
          <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Antenna Dish */}
        <mesh
          position={[0, 0.3, 0]}
          rotation={[Math.PI / 4, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSubsystem('antenna');
          }}
        >
          <coneGeometry args={[0.6, 0.25, 32, 1, true]} />
          <meshStandardMaterial
            color={antennaColor}
            roughness={0.4}
            metalness={0.8}
            side={2}
          />
        </mesh>
        {/* Antenna feed horn */}
        <mesh position={[0, 0.45, 0.05]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.2]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
