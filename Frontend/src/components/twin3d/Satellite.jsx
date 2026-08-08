import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Subsystem visual status colors matching ORION AI design system
const COLORS = {
  NOMINAL: '#57c67a',  // var(--accent-green)
  CAUTION: '#f0a83b',  // var(--accent-amber)
  CRITICAL: '#ef5350', // var(--accent-red)
  DEFAULT_METAL: '#1e293b',
  GOLD_FOIL: '#d97706',
  BLUE_SOLAR: '#0284c7',
  SOLAR_CELLS: '#0f172a',
  CYAN: '#38bdf8',
  VIOLET: '#8b5cf6',
  SILVER: '#94a3b8',
};

// Generate procedural Gold MLI (Multi-Layer Insulation) Foil texture
function createGoldFoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base metallic gold gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.3, '#d97706');
    grad.addColorStop(0.7, '#b45309');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Crinkled foil noise lines
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }

    // Crinkle shadow lines
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.5)';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Generate procedural Photovoltaic Silicon Wafer Solar Cell texture
function createSolarCellTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep royal blue solar cell substrate
    ctx.fillStyle = '#031e40';
    ctx.fillRect(0, 0, 256, 512);

    // Grid of solar silicon wafers
    const cols = 4;
    const rows = 12;
    const cellW = 256 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Wafer body
        const cellGrad = ctx.createLinearGradient(c * cellW, r * cellH, (c + 1) * cellW, (r + 1) * cellH);
        cellGrad.addColorStop(0, '#0284c7');
        cellGrad.addColorStop(0.5, '#0369a1');
        cellGrad.addColorStop(1, '#075985');
        ctx.fillStyle = cellGrad;
        ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);

        // Anti-reflective specular shine
        ctx.fillStyle = 'rgba(224, 242, 254, 0.2)';
        ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, (cellH - 6) * 0.3);
      }
    }

    // Metallic Silver Busbar Conductor Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;

    // Vertical busbars
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, 512);
      ctx.stroke();
    }
    // Horizontal cell gaps
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(256, r * cellH);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function Satellite({
  selectedSubsystem,
  setSelectedSubsystem,
  panelBStatus = 'NOMINAL',
  batteryStatus = 'NOMINAL',
}) {
  const satelliteRef = useRef();

  // Generate high-res textures
  const goldFoilTexture = useMemo(() => createGoldFoilTexture(), []);
  const solarCellTexture = useMemo(() => createSolarCellTexture(), []);

  // Smooth floating pitch & yaw rotation
  useFrame((state, delta) => {
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y += 0.18 * delta;
      satelliteRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.04;
      satelliteRef.current.rotation.z = Math.cos(state.clock.getElapsedTime() * 0.3) * 0.02;
    }
  });

  // Calculate dynamic highlight colors based on subsystem selection & state
  const isBatterySelected = selectedSubsystem === 'battery';
  const isPanelASelected = selectedSubsystem === 'panelA';
  const isPanelBSelected = selectedSubsystem === 'panelB';
  const isAntennaSelected = selectedSubsystem === 'antenna';

  const batteryColor = batteryStatus === 'NOMINAL' ? COLORS.NOMINAL : COLORS.CRITICAL;
  const panelBColor = panelBStatus === 'NOMINAL' ? COLORS.NOMINAL : COLORS.CAUTION;

  return (
    <group ref={satelliteRef}>

      {/* 1. MAIN SATELLITE BUS / CHASSIS (Gold MLI Thermal Insulation & Structural Deck) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem && setSelectedSubsystem('battery');
        }}
      >
        {/* Primary Body Frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.3, 1.7]} />
          <meshStandardMaterial
            map={goldFoilTexture}
            roughness={0.3}
            metalness={0.8}
            color={
              isBatterySelected
                ? '#38bdf8'
                : batteryStatus === 'CRITICAL'
                  ? '#ef4444'
                  : batteryStatus === 'CAUTION'
                    ? '#f59e0b'
                    : '#e2e8f0'
            }
          />
        </mesh>


        {/* Structural Corner Ribs / Titanium Beams */}
        {[-0.66, 0.66].map((x) =>
          [-0.66, 0.66].map((y) => (
            <mesh key={`rib-${x}-${y}`} position={[x, y, 0]}>
              <boxGeometry args={[0.08, 0.08, 1.72]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Front Radiator Panel & Telemetry Battery Status Matrix */}
        <mesh position={[0, 0, 0.86]}>
          <boxGeometry args={[0.9, 0.9, 0.02]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Pulsating EPS Battery Status LED Indicator */}
        <mesh position={[0, 0, 0.88]}>
          <boxGeometry args={[0.7, 0.3, 0.02]} />
          <meshStandardMaterial
            color={batteryColor}
            emissive={batteryColor}
            emissiveIntensity={isBatterySelected ? 1.5 : 0.6}
          />
        </mesh>
      </group>

      {/* 2. DUAL STAR TRACKER BAFFLES (Mounted on Top Deck) */}
      <group position={[0, 0.72, 0.3]}>
        {[-0.25, 0.25].map((x, idx) => (
          <group key={`startracker-${idx}`} position={[x, 0, 0]} rotation={[-Math.PI / 6, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.06, 0.25, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <circleGeometry args={[0.07, 16]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. MULTISPECTRAL OPTICAL PAYLOAD CAMERA ASSEMBLY (Bottom Aperture) */}
      <group position={[0, -0.72, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.38, 0.3, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Anti-reflective Optical Lens Glass */}
        <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.28, 32]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0284c7"
            emissiveIntensity={0.6}
            roughness={0.05}
            metalness={1.0}
          />
        </mesh>
      </group>

      {/* 4. RCS ATTITUDE THRUSTER NOZZLES (Four Bottom Corners) */}
      {[-0.6, 0.6].map((x) =>
        [-0.8, 0.8].map((z) => (
          <group key={`thruster-${x}-${z}`} position={[x, -0.68, z]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.07, 0.16, 16, 1, true]} />
              <meshStandardMaterial color="#78350f" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))
      )}

      {/* 5. HIGH-GAIN PARABOLIC COMMUNICATIONS DISH ANTENNA (Top Deck Mount) */}
      <group
        position={[0, 0.72, -0.3]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem && setSelectedSubsystem('antenna');
        }}
      >
        {/* Antenna Articulated Mast */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.4, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Parabolic Reflector Dish */}
        <mesh
          position={[0, 0.45, 0]}
          rotation={[Math.PI / 3.5, 0, 0]}
        >
          <coneGeometry args={[0.7, 0.3, 32, 1, true]} />
          <meshStandardMaterial
            color={isAntennaSelected ? '#a855f7' : '#f8fafc'}
            roughness={0.2}
            metalness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Feedhorn Sub-Reflector Tripod Struts */}
        <group position={[0, 0.55, 0.1]} rotation={[Math.PI / 3.5, 0, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.25, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
          </mesh>

          {/* Glowing RF Communications Transceiver Tip */}
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={isAntennaSelected ? 2.0 : 0.8}
            />
          </mesh>
        </group>
      </group>

      {/* 6. SOLAR ARRAY PANEL WING A (Left) */}
      <group
        position={[-2.3, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem && setSelectedSubsystem('panelA');
        }}
      >
        {/* Metallic Yoke & Rotary Hinge Joint */}
        <mesh position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Carbon Fiber Backing Panel Structure */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.05, 2.6]} />
          <meshStandardMaterial
            color={isPanelASelected ? '#38bdf8' : '#0f172a'}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Photovoltaic Silicon Wafer Cells Layer (Top Surface) */}
        <mesh position={[0, 0.03, 0]}>
          <planeGeometry args={[1.92, 2.5]} />
          <meshStandardMaterial
            map={solarCellTexture}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>

        {/* Photovoltaic Silicon Wafer Cells Layer (Bottom Surface) */}
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
          <planeGeometry args={[1.92, 2.5]} />
          <meshStandardMaterial
            map={solarCellTexture}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </group>

      {/* 7. SOLAR ARRAY PANEL WING B (Right) */}
      <group
        position={[2.3, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubsystem && setSelectedSubsystem('panelB');
        }}
      >
        {/* Metallic Yoke & Rotary Hinge Joint */}
        <mesh position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Carbon Fiber Backing Panel Structure */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.05, 2.6]} />
          <meshStandardMaterial
            color={isPanelBSelected ? '#38bdf8' : (panelBStatus === 'NOMINAL' ? '#0f172a' : '#451a03')}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Photovoltaic Silicon Wafer Cells Layer (Top Surface) */}
        <mesh position={[0, 0.03, 0]}>
          <planeGeometry args={[1.92, 2.5]} />
          <meshStandardMaterial
            map={solarCellTexture}
            roughness={0.15}
            metalness={0.95}
            color={panelBStatus === 'NOMINAL' ? '#ffffff' : '#f59e0b'}
          />
        </mesh>

        {/* Photovoltaic Silicon Wafer Cells Layer (Bottom Surface) */}
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
          <planeGeometry args={[1.92, 2.5]} />
          <meshStandardMaterial
            map={solarCellTexture}
            roughness={0.15}
            metalness={0.95}
            color={panelBStatus === 'NOMINAL' ? '#ffffff' : '#f59e0b'}
          />
        </mesh>

        {/* Panel B Status Warning Glow (if impaired) */}
        {panelBStatus !== 'NOMINAL' && (
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.05, 0.08, 2.65]} />
            <meshStandardMaterial
              color={panelBColor}
              emissive={panelBColor}
              emissiveIntensity={0.8}
              transparent
              opacity={0.4}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
