import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import Earth from "../twin3d/Earth";
import Satellite from "../twin3d/Satellite";
import { getPositionAtTime, keplerToECI } from "@/lib/orbit";
import { getStationECIPosition, elevationAngle } from "@/lib/groundContact";
import { groundStations } from "@/data/groundStations";

// Global monkeypatch to prevent React Three Fiber from crashing on dev-only "data-tsd-source" attribute injection
if (typeof window !== "undefined") {
  [THREE.Object3D, THREE.BufferGeometry, THREE.Material].forEach((cls) => {
    if (cls && !Object.prototype.hasOwnProperty.call(cls.prototype, "data")) {
      Object.defineProperty(cls.prototype, "data", {
        get() {
          if (!this._dummyData) this._dummyData = {};
          return this._dummyData;
        },
        set(val) {
          this._dummyData = val;
        },
        configurable: true,
      });
    }
  });
}

const satellitesConfig = [
  { id: "GSAT-201", plane: 0, phase: 0 },
  { id: "GSAT-204", plane: 1, phase: 140 },
];


const EarthRadiusScale = 1.5;
const EarthRotationSpeed = (2 * Math.PI) / 86400;

// Conversion helper: ECI position to Latitude/Longitude
function eciToLatLon([x, y, z], met) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0) return { lat: 0, lon: 0 };
  const lat = Math.asin(z / r) * (180 / Math.PI);
  let lon = (Math.atan2(y, x) - EarthRotationSpeed * met) * (180 / Math.PI);
  lon = ((lon + 180) % 360) - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

// Projection helpers for 2D Map
function lonToX(lon, width = 800) {
  return 40 + ((lon + 180) / 360) * (width - 80);
}

// Map mapping from [-60, 60] latitude to SVG height
function latToY(lat, height = 130) {
  const clampedLat = Math.max(-60, Math.min(60, lat));
  return 20 + ((60 - clampedLat) / 120) * (height - 40);
}

// Helper: split a continuous orbit track into SVG segments to prevent horizontal tearing
function getSvgPaths(points, width = 800, height = 130) {
  const paths = [];
  let currentPath = [];

  points.forEach((pt, i) => {
    const x = lonToX(pt.lon, width);
    const y = latToY(pt.lat, height);

    if (currentPath.length > 0) {
      const prevPt = points[i - 1];
      if (Math.abs(pt.lon - prevPt.lon) > 180) {
        paths.push(currentPath);
        currentPath = [];
      }
    }
    currentPath.push(`${currentPath.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  });

  if (currentPath.length > 0) {
    paths.push(currentPath);
  }

  return paths.map((p) => p.join(" "));
}

// 3D Line Connection Component
function LineConnection({ from, to, isHighlighted }) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  }, [from, to]);

  return (
    <line>
      <bufferGeometry attach="geometry" onUpdate={(self) => self.setFromPoints(points)} />
      <lineBasicMaterial
        attach="material"
        color={isHighlighted ? "#ffb703" : "#57c67a"}
        transparent
        opacity={isHighlighted ? 0.65 : 0.22}
        linewidth={isHighlighted ? 2.5 : 1}
      />
    </line>
  );
}

// 3D Inner Component
function Constellation3DInner({ latest, activeSatellites, sunDirection, selectedSatId, onSelectSat }) {

  const orbitLinesRef = useRef([]);
  const met = latest?.met ?? 128400;

  useFrame(() => {
    // Dynamic J2 orbit tracks for active planes
    orbitLinesRef.current.forEach((line, index) => {
      if (!line) return;
      const sat = satellitesConfig[index];
      if (!sat) return;

      const points = [];
      const period = 5954;
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const checkT = met - period + (i * period) / steps;
        const elements = {
          a: 7100000,
          e: 0.01,
          i: sat.plane === 0 ? 55 : 97.8,
          raan: sat.plane === 0 ? 0 : 120,
          argPer: sat.plane * 45,
          meanAnomaly: sat.phase,
        };
        const pos = keplerToECI(elements, checkT).position;
        const scale = 1.5 / 6371000;
        points.push(new THREE.Vector3(pos[0] * scale, pos[1] * scale, pos[2] * scale));
      }
      line.geometry.setFromPoints(points);
    });
  });

  return (
    <group>
      <Stars radius={150} depth={60} count={5000} factor={4.5} saturation={0.5} fade speed={1.2} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={2.5} />
      <directionalLight position={[-5, -3, -5]} intensity={0.8} color="#00f0ff" />

      {/* 3D Earth Globe */}
      <Earth />




      {/* Orbit Lines */}
      {satellitesConfig.map((sat, index) => {
        const isSelected = selectedSatId === sat.id;
        return (
          <line key={sat.id} ref={(el) => (orbitLinesRef.current[index] = el)}>
            <bufferGeometry />
            <lineBasicMaterial
              color={isSelected ? "#ffb703" : "#1f6f78"}
              transparent
              opacity={isSelected ? 0.6 : 0.16}
            />
          </line>
        );
      })}

      {/* Ground Stations (Sleek Green 3D Diamond Indicators) */}
      {groundStations.map((station) => {
        const pos = getStationECIPosition(station, met);
        return (
          <group key={station.id} position={pos}>
            <mesh>
              <octahedronGeometry args={[0.025]} />
              <meshBasicMaterial color="#57c67a" transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}


      {/* Satellites */}
      {activeSatellites.map((sat) => {
        const isSelected = selectedSatId === sat.id;

        // Calculate smooth flight direction orientation
        const zAxis = new THREE.Vector3(0, 0, 1);
        const quat = new THREE.Quaternion().setFromUnitVectors(zAxis, sat.flightDir || new THREE.Vector3(0, 1, 0));
        const euler = new THREE.Euler().setFromQuaternion(quat);

        return (
          <group key={sat.id}>
            <group position={sat.pos} onClick={(e) => { e.stopPropagation(); onSelectSat && onSelectSat(sat.id); }}>
              {/* Highlight Ring around Selected Satellite */}

              {isSelected && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.09, 0.11, 32]} />
                  <meshBasicMaterial color={sat.isAnomalyActive ? "#f43f5e" : "#ffb703"} side={THREE.DoubleSide} transparent opacity={0.65} />
                </mesh>
              )}

              {/* Pulsating Hazard Ring for Active Anomaly */}
              {sat.isAnomalyActive && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.13, 0.17, 32]} />
                  <meshBasicMaterial color="#f43f5e" side={THREE.DoubleSide} transparent opacity={0.85} />
                </mesh>
              )}

              <group scale={0.038} rotation={[euler.x, euler.y, euler.z]}>
                <Satellite selectedSubsystem={null} setSelectedSubsystem={() => {}} />
              </group>
              
              {/* Satellite name label */}
              <Html distanceFactor={4.5} center position={[0, 0.22, 0]}>
                <div className={`font-mono text-[7.5px] font-bold bg-black/95 border px-1.5 py-0.5 rounded-xs whitespace-nowrap pointer-events-none transition-all duration-300 ${
                  sat.isAnomalyActive
                    ? "text-rose-400 border-rose-500 bg-rose-950/90 shadow-lg shadow-rose-500/50 animate-pulse scale-110"
                    : isSelected
                      ? "text-[#ffb703] border-[#ffb703] shadow-md shadow-[#ffb703]/20 scale-105"
                      : sat.inEclipse
                        ? "text-warning border-warning/30"
                        : "text-[#4fd8c8] border-[#4fd8c8]/30"
                }`}>
                  {sat.id} {sat.isAnomalyActive ? "⚠️ ANOMALY" : ""}
                </div>
              </Html>
            </group>


            {/* Render stable lines to visible stations */}
            {sat.contacts.map((c) => (
              <LineConnection
                key={`${sat.id}-${c.stationId}`}
                from={sat.pos}
                to={c.gsPos}
                isHighlighted={isSelected}
              />
            ))}
          </group>
        );
      })}

      {/* Sun indicator */}
      <group position={sunDirection.clone().multiplyScalar(5.2)}>
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        <pointLight color="#fff4e0" intensity={1.5} distance={15} />
        <Html distanceFactor={5.5} center>
          <div className="font-mono text-[7px] font-bold text-[#ffcc00] bg-black/95 border border-warning/40 px-1 py-px rounded-xs uppercase">
            Sun
          </div>
        </Html>
      </group>
    </group>
  );
}

// Main Dashboard Component
/**
 * @param {{
 *   latest?: import('../../lib/smoa/types').TelemetryFrame | null,
 *   history?: import('../../lib/smoa/types').TelemetryFrame[],
 *   status?: import('../../lib/smoa/types').LinkStatus,
 *   events?: import('../../lib/smoa/types').AnomalyEvent[]
 * }} props
 */
export default function ConstellationDashboard({ latest, history = [], status, events = [] }) {
  const met = latest?.met ?? 128400;


  // Selected satellite state (for detailed telemetry roster inspect)
  const [selectedSatId, setSelectedSatId] = useState("GSAT-201");
  const [rosterFilter, setRosterFilter] = useState("ALL");
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);

  // Anomalies dictionary state (satellite ID -> true if voltage drop injected)
  const [anomalies, setAnomalies] = useState({});

  const handleToggleAnomaly = (id) => {
    setAnomalies((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        setShowAnomalyModal(true);
      }
      return { ...prev, [id]: nextState };
    });
  };

  // 1. Establish Sun Vector
  const sunDirection = useMemo(() => {
    const angleRad = (82.5 * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
  }, []);

  // 2. Individual Satellite State Simulation (SoC charges/discharges based on eclipse status)
  const [satellitesState, setSatellitesState] = useState(() => {
    return satellitesConfig.map((s, idx) => ({
      id: s.id,
      soc: 85.0 + Math.sin(idx) * 8.0,
      fuel: 92.4 - idx * 1.8,
    }));
  });

  // Calculate 3D and 2D positions of all satellites
  const activeSatellites = useMemo(() => {
    const scale = 1.5 / 6371000;
    return satellitesConfig.map((sat) => {
      const isGSAT201 = sat.id === "GSAT-201";

      const elements = {
        a: 7100000,
        e: 0.01,
        i: sat.plane === 0 ? 55 : 97.8,
        raan: sat.plane === 0 ? 0 : 120,
        argPer: sat.plane * 45,
        meanAnomaly: sat.phase,
      };

      // numerical or kepler propagation
      const eci = keplerToECI(elements, met).position;
      const threePos = [eci[0] * scale, eci[1] * scale, eci[2] * scale];

      // Smooth flight direction rotation vector
      const nextEci = keplerToECI(elements, met + 2).position;
      const nextThreePos = [nextEci[0] * scale, nextEci[1] * scale, nextEci[2] * scale];
      const flightDir = new THREE.Vector3().subVectors(
        new THREE.Vector3(...nextThreePos),
        new THREE.Vector3(...threePos)
      ).normalize();

      // Eclipse test (cylindrical projection in Earth's shadow)
      const satVec = new THREE.Vector3(...threePos);
      const projection = satVec.dot(sunDirection);
      let inEclipse = false;
      if (projection < 0) {
        const perp = satVec.clone().sub(sunDirection.clone().multiplyScalar(projection));
        inEclipse = perp.length() < 1.49; // Earth shadow radius
      }

      // Check contacts with all ground stations
      const contacts = [];
      groundStations.forEach((gs) => {
        const gsPos = getStationECIPosition(gs, met);
        const el = elevationAngle(threePos, gs, met);
        if (el > 8) {
          contacts.push({ stationId: gs.id, name: gs.name, gsPos });
        }
      });

      const { lat, lon } = eciToLatLon(eci, met);

      // Link simulation state or live seeded stream data for GSAT-201
      const state = satellitesState.find((s) => s.id === sat.id) || { soc: 85, fuel: 80 };

      const isAnomalyActive = isGSAT201
        ? (
            (latest?.anomalyScore !== undefined && latest.anomalyScore > 0.5) ||
            (latest?.power?.busVoltage !== undefined && latest.power.busVoltage < 21.0) ||
            !!anomalies[sat.id]
          )
        : !!anomalies[sat.id];


      const liveSoc = isGSAT201 && latest?.power?.stateOfCharge !== undefined
        ? latest.power.stateOfCharge
        : (isAnomalyActive ? Math.max(14.2, state.soc - 40) : state.soc);

      const liveBusVoltage = isGSAT201 && latest?.power?.busVoltage !== undefined
        ? latest.power.busVoltage
        : (isAnomalyActive ? 18.93 : 28.2);

      return {
        id: sat.id,
        pos: threePos,
        flightDir,
        lat,
        lon,
        inEclipse,
        contacts,
        soc: liveSoc,
        busVoltage: liveBusVoltage,
        fuel: state.fuel,
        plane: sat.plane,
        isAnomalyActive,
      };
    });
  }, [met, sunDirection, satellitesState, anomalies, latest, events]);


  // Tick simulation of satellite batteries
  useEffect(() => {
    const timer = setInterval(() => {
      setSatellitesState((prev) =>
        prev.map((s) => {
          const satObj = activeSatellites.find((a) => a.id === s.id);
          if (!satObj) return s;
          
          let nextSoc = s.soc;
          if (satObj.inEclipse) {
            nextSoc -= 0.045; // drain
          } else {
            nextSoc += 0.065; // charge
          }
          return {
            ...s,
            soc: Math.max(12, Math.min(99.6, nextSoc)),
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSatellites]);

  // 3. Sample 2D ground track orbits for rendering sine waves
  const groundTrackOrbits = useMemo(() => {
    const period = 5954;
    const steps = 80;
    
    return [0, 1, 2].map((planeIdx) => {
      const points = [];
      const baselineElements = {
        a: 7100000,
        e: 0.01,
        i: 55,
        raan: planeIdx * 120,
        argPer: 0,
        meanAnomaly: 0,
      };

      for (let i = 0; i <= steps; i++) {
        const t = met - period + (i * period) / steps;
        const eci = keplerToECI(baselineElements, t).position;
        const { lat, lon } = eciToLatLon(eci, t);
        points.push({ lat, lon });
      }
      return points;
    });
  }, [met]);

  // Selected Sat Object
  const selectedSatObj = useMemo(() => {
    return activeSatellites.find((s) => s.id === selectedSatId) || activeSatellites[0];
  }, [activeSatellites, selectedSatId]);

  // Roster filters
  const filteredSatellites = useMemo(() => {
    return activeSatellites.filter((sat) => {
      if (rosterFilter === "SUNLIT") return !sat.inEclipse;
      if (rosterFilter === "ECLIPSE") return sat.inEclipse;
      return true;
    });
  }, [activeSatellites, rosterFilter]);

  // Aggregate metrics
  const totalSatellites = activeSatellites.length;
  const eclipseCount = activeSatellites.filter((s) => s.inEclipse).length;
  const sunlitCount = totalSatellites - eclipseCount;

  const avgSoC = useMemo(() => {
    return Math.round(activeSatellites.reduce((acc, s) => acc + s.soc, 0) / totalSatellites);
  }, [activeSatellites, totalSatellites]);

  const minSoC = useMemo(() => {
    return Math.round(Math.min(...activeSatellites.map((s) => s.soc)));
  }, [activeSatellites]);

  // Alarm Counts
  const battAlarms = activeSatellites.filter((s) => s.soc < 30).length;
  const fuelAlarms = activeSatellites.filter((s) => s.fuel < 75).length;
  const anomalyCount = activeSatellites.filter((s) => s.isAnomalyActive).length;

  const healthScore = Math.max(20, 100 - (battAlarms * 12 + fuelAlarms * 8 + anomalyCount * 15 + (status === "disconnected" ? 50 : 0)));

  // Selected Node Health Score (dynamically calculated for selected satellite, climbing gradually as battery recharges)
  const selectedNodeHealthScore = useMemo(() => {
    if (!selectedSatObj) return 100;
    if (selectedSatObj.isAnomalyActive) {
      let score = 100;
      if (selectedSatObj.busVoltage && selectedSatObj.busVoltage < 21.0) score -= 35;
      if (selectedSatObj.soc < 40) score -= Math.round((40 - selectedSatObj.soc) * 1.2);
      return Math.max(20, Math.min(65, Math.round(score)));
    }
    // Recovery Phase: after stopping anomaly, health index smoothly recharges with battery SoC
    let score = 100;
    if (selectedSatObj.soc < 95) score -= Math.round((95 - selectedSatObj.soc) * 0.75);
    if (selectedSatObj.fuel < 75) score -= Math.round((75 - selectedSatObj.fuel) * 0.4);
    if (status === "disconnected") score -= 20;
    return Math.max(40, Math.min(100, Math.round(score)));
  }, [selectedSatObj, status]);



  // Sparkline history tracking average SoC
  const [socHistory, setSocHistory] = useState([82, 83, 83, 84, 84, 85, 86, 86, 87, 87, 88, 88, 89, 89, 89]);
  useEffect(() => {
    setSocHistory((prev) => {
      const next = prev.length >= 30 ? prev.slice(1) : prev.slice();
      next.push(avgSoC);
      return next;
    });
  }, [avgSoC]);

  const sparklinePath = useMemo(() => {
    const w = 110;
    const h = 20;
    const len = socHistory.length;
    const dx = len > 1 ? w / (len - 1) : 0;
    return socHistory
      .map((val, i) => {
        const x = i * dx;
        const y = h - ((val - 60) / 40) * (h - 4) - 2;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [socHistory]);

  const handleToggleAnomaly = (satId) => {
    setAnomalies((prev) => ({
      ...prev,
      [satId]: !prev[satId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#02050a] border border-border rounded-md overflow-hidden shadow-2xl">
      
      {/* Dynamic Main Body: Left 3D/2D views, Right interactive roster */}
      <div className="flex flex-row flex-1 min-h-0">
        
        {/* Left Side: 3D Globe View & 2D Map */}
        <div className="flex flex-col flex-1 min-h-0 border-r border-border/20">
          
          {/* 1. 3D Constellation Orbit View (Expanded to full height and zoomed in) */}
          <div className="relative w-full flex-1 min-h-0 bg-black overflow-hidden select-none">
            <div className="absolute top-3 left-4 z-10 font-tech text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase pointer-events-none">
              ORION CONSTELLATION · 3D ORBIT TRACKER
            </div>
            {selectedSatObj && (
              <div className="absolute top-3 right-4 z-10 font-mono text-[0.58rem] bg-black/80 border border-[#ffb703]/30 px-2 py-0.5 rounded-sm text-[#ffb703] pointer-events-none uppercase">
                Tracking: {selectedSatObj.id} ({selectedSatObj.inEclipse ? "Eclipse" : "Sunlit"})
              </div>
            )}
            <div className="absolute inset-0 w-full h-full">
              <Canvas style={{ width: "100%", height: "100%", display: "block" }}>
                <PerspectiveCamera makeDefault position={[2.1, 1.2, 2.1]} fov={40} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 3, 5]} intensity={1.5} color="#fff4e0" />
                <pointLight position={[-5, -3, -5]} intensity={0.5} color="#1f6f78" />
                <Suspense fallback={null}>
                  <Constellation3DInner
                    latest={latest}
                    activeSatellites={activeSatellites}
                    sunDirection={sunDirection}
                    selectedSatId={selectedSatId}
                    onSelectSat={setSelectedSatId}
                  />

                </Suspense>
                <OrbitControls
                  enableZoom={true}
                  enablePan={false}
                  minDistance={1.8}
                  maxDistance={8}
                  autoRotate
                  autoRotateSpeed={0.2}
                  makeDefault
                />
              </Canvas>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Node Roster */}
        <div className="w-[330px] flex flex-col bg-[#03060c] min-h-0 select-none shrink-0">
          {/* Header */}
          <div className="p-3 border-b border-border/20 bg-background/40">
            <span className="font-tech text-[0.68rem] tracking-[0.12em] text-primary uppercase block font-bold">
              CONSTELLATION NODES
            </span>
            <span className="font-mono text-[0.52rem] text-muted-foreground uppercase tracking-wide block mt-0.5">
              Select node to inspect detailed telemetry
            </span>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 mt-2.5">
              {["ALL", "SUNLIT", "ECLIPSE"].map((f) => (
                <button
                  key={f}
                  onClick={() => setRosterFilter(f)}
                  className={`flex-1 font-mono text-[0.55rem] font-bold uppercase py-0.5 px-1 border rounded-xs transition-colors ${
                    rosterFilter === f
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "ALL" ? `All (${totalSatellites})` : f === "SUNLIT" ? `Sun (${sunlitCount})` : `Eclipse (${eclipseCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Node list */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/10 p-1.5 space-y-1">
            {filteredSatellites.map((sat) => {
              const isSelected = selectedSatId === sat.id;
              const hasAnomaly = sat.isAnomalyActive;
              return (
                <div
                  key={sat.id}
                  onClick={() => {
                    setSelectedSatId(sat.id);
                    if (sat.isAnomalyActive) {
                      setShowAnomalyModal(true);
                    }
                  }}
                  className={`relative flex flex-col p-2 rounded-sm cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-primary/5 border-[#ffb703]/50 shadow-sm shadow-[#ffb703]/5"
                      : "bg-[#060b13] border-border/10 hover:border-border/30"
                  }`}
                >
                  {/* Selected accent bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#ffb703]" />
                  )}

                  {/* Top row */}
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-[0.68rem] font-bold ${
                      isSelected ? "text-[#ffb703]" : "text-foreground"
                    }`}>
                      {sat.id}
                    </span>
                    <span className="font-mono text-[0.52rem] text-muted-foreground">
                      PLANE {sat.plane}
                    </span>
                  </div>

                  {/* Middle row: battery bar & contacts */}
                  <div className="grid grid-cols-5 gap-1.5 items-center mt-1.5">
                    {/* SoC Progress Bar */}
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-mono text-[0.55rem] text-muted-foreground uppercase shrink-0">SoC</span>
                      <div className="flex-1 h-1.5 bg-background/60 rounded-full overflow-hidden border border-border/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            hasAnomaly
                              ? "bg-critical"
                              : sat.soc >= 70
                                ? "bg-nominal"
                                : sat.soc >= 40
                                  ? "bg-warning"
                                  : "bg-critical"
                          }`}
                          style={{ width: `${sat.soc}%` }}
                        />
                      </div>
                      <span className={`font-mono text-[0.58rem] font-semibold text-right w-8 shrink-0 ${
                        hasAnomaly ? "text-critical" : "text-foreground"
                      }`}>
                        {Math.round(sat.soc)}%
                      </span>
                    </div>

                    {/* Ground contacts */}
                    <div className="col-span-2 text-right">
                      {sat.contacts.length > 0 ? (
                        <span className="font-mono text-[0.52rem] text-nominal font-bold tracking-wide">
                          {sat.contacts.map((c) => c.name.split("-")[1] || c.name).join(", ")}
                        </span>
                      ) : (
                        <span className="font-mono text-[0.52rem] text-muted-foreground/60 italic">
                          No Links
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Status Indicators */}
                  <div className="flex justify-between items-center mt-1.5 font-mono text-[0.52rem]">
                    <span className="text-muted-foreground uppercase">
                      Fuel: <span className="text-foreground font-semibold">{sat.fuel.toFixed(1)}%</span>
                    </span>
                    <div className="flex gap-2">
                      {hasAnomaly && (
                        <span className="text-critical font-bold uppercase animate-pulse border border-critical/20 px-1 py-px rounded-2xs bg-critical/5">
                          Anomaly
                        </span>
                      )}
                      {sat.inEclipse ? (
                        <span className="text-warning font-semibold uppercase px-1 py-px border border-warning/20 bg-warning/5 rounded-2xs">
                          Eclipse
                        </span>
                      ) : (
                        <span className="text-primary font-semibold uppercase px-1 py-px border border-primary/20 bg-primary/5 rounded-2xs">
                          Sunlit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Interactive Health & Subsystem Panel (bottom, fixed 140px height) */}
      <div className="h-[140px] bg-[#03060d] border-t border-border/40 px-6 py-2.5 shrink-0 flex flex-col justify-between select-none">
        
        {/* Bulletproof horizontal flexbox row layout (replaces grid to prevent wrapping and spacing overlaps) */}
        <div className="flex flex-row justify-between items-center flex-1 w-full gap-6">
          
          {/* Column 1: Selected Node Health Index (22% width) */}
          <div className="flex items-center justify-between border-r border-border/10 pr-6 h-full w-[22%] shrink-0">
            <div className="flex flex-col leading-tight">
              <span className="font-tech text-[0.58rem] text-muted-foreground uppercase tracking-wider">
                {selectedSatObj?.id || "Node"} Health Index
              </span>
              <span className={`num text-3xl font-extrabold mt-0.5 ${
                selectedNodeHealthScore >= 75 ? "text-nominal" : selectedNodeHealthScore >= 45 ? "text-warning" : "text-critical"
              }`}>
                {selectedNodeHealthScore}
                <span className="text-xs font-semibold text-muted-foreground ml-1">/100</span>
              </span>
            </div>

            <div className="flex flex-col pl-4 justify-center">
              <div className="flex items-baseline gap-2 font-mono text-[0.65rem]">
                <span className="text-foreground font-bold">{totalSatellites}</span>
                <span className="text-muted-foreground text-[0.52rem] uppercase">Active</span>
              </div>
              <div className="flex items-baseline gap-2 font-mono text-[0.65rem] mt-0.5">
                <span className="text-primary font-bold">{sunlitCount}</span>
                <span className="text-muted-foreground text-[0.52rem] uppercase">Sunlit</span>
              </div>
              <div className="flex items-baseline gap-2 font-mono text-[0.65rem] mt-0.5">
                <span className="text-warning font-bold">{eclipseCount}</span>
                <span className="text-muted-foreground text-[0.52rem] uppercase">Eclipse</span>
              </div>
            </div>
          </div>

          {/* Column 2: Selected Node Subsystem Details (30% width) */}
          {selectedSatObj && (
            <div className="flex flex-col gap-1 border-r border-border/10 pr-6 h-full justify-center w-[30%] shrink-0">
              <div className="flex justify-between items-center w-full">
                <span className="font-tech text-[0.58rem] text-[#ffb703] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  Node Status: {selectedSatObj.id}
                  {selectedSatObj.isAnomalyActive && (
                    <span className="text-critical animate-pulse font-extrabold text-[0.52rem]">⚠️ ANOMALY</span>
                  )}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedSatObj.isAnomalyActive && (
                    <button
                      onClick={() => setShowAnomalyModal(true)}
                      className="font-mono text-[0.52rem] font-bold uppercase px-1.5 py-0.5 border border-critical bg-critical/20 text-critical hover:bg-critical/30 rounded-xs transition-colors shrink-0 animate-pulse"
                    >
                      Inspect Anomaly & SOP
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleAnomaly(selectedSatObj.id)}
                    className={`font-mono text-[0.52rem] font-bold uppercase px-1.5 py-0.5 border rounded-xs transition-colors shrink-0 ${
                      selectedSatObj.isAnomalyActive
                        ? "bg-critical/15 border-critical text-critical hover:bg-critical/25"
                        : "bg-warning/10 border-warning/40 text-warning hover:bg-warning/20"
                    }`}
                  >
                    {selectedSatObj.isAnomalyActive ? "Resolve Anomaly" : "Inject Volt Drop"}
                  </button>
                </div>
              </div>

              {/* Subsystems */}
              <div className="grid grid-cols-3 gap-2 mt-1 w-full">
                <div className="flex flex-col font-mono text-[0.52rem]">
                  <span className="text-muted-foreground uppercase text-[0.48rem]">EPS (Power)</span>
                  <span className={`font-bold uppercase mt-0.5 ${
                    selectedSatObj.isAnomalyActive ? "text-critical" : "text-nominal"
                  }`}>
                    {selectedSatObj.isAnomalyActive
                      ? `Critical (${selectedSatObj.busVoltage ? selectedSatObj.busVoltage.toFixed(1) + "V" : "Droop"})`
                      : `Nominal (${selectedSatObj.busVoltage ? selectedSatObj.busVoltage.toFixed(1) + "V" : "28.2V"})`}
                  </span>
                </div>
                <div className="flex flex-col font-mono text-[0.52rem]">
                  <span className="text-muted-foreground uppercase text-[0.48rem]">AOCS (Attitude)</span>
                  <span className="text-nominal font-bold uppercase mt-0.5">
                    {selectedSatObj.id === "GSAT-201" && latest?.adcs
                      ? `${latest.adcs.roll.toFixed(1)}° R / ${latest.adcs.pitch.toFixed(1)}° P`
                      : "Nominal (0.2° R)"}
                  </span>
                </div>
                <div className="flex flex-col font-mono text-[0.52rem]">
                  <span className="text-muted-foreground uppercase text-[0.48rem]">COMMS (RF)</span>
                  <span className={`font-bold uppercase mt-0.5 ${
                    selectedSatObj.contacts.length > 0 ? "text-nominal" : "text-muted-foreground"
                  }`}>
                    {selectedSatObj.id === "GSAT-201" && latest?.comms
                      ? `${latest.comms.signalDbm.toFixed(0)}dBm (${latest.comms.packetLoss.toFixed(1)}%)`
                      : selectedSatObj.contacts.length > 0
                        ? `Linked (${selectedSatObj.contacts.map((c) => c.name.split("-")[1] || c.name).join(", ")})`
                        : "Standby"}
                  </span>
                </div>
              </div>
            </div>
          )}



          {/* Column 3: Node SoC vs Fleet Min (28% width) */}
          <div className="flex items-center justify-between border-r border-border/10 pr-6 h-full pl-2 w-[28%] shrink-0">
            <div className="flex flex-col leading-tight shrink-0">
              <span className="font-tech text-[0.55rem] text-[#ffb703] uppercase tracking-wide font-bold">
                {selectedSatObj?.id || "Node"} SoC (Fleet Min)
              </span>
              <span className="num text-lg font-bold mt-0.5">
                <span className={selectedSatObj?.isAnomalyActive ? "text-critical" : "text-primary"}>
                  {selectedSatObj ? Math.round(selectedSatObj.soc) : avgSoC}%
                </span>
                <span className="text-muted-foreground text-xs font-normal mx-1.5">/</span>
                <span className={minSoC < 40 ? "text-critical" : "text-foreground"}>{minSoC}% min</span>
              </span>
            </div>


            {/* Sparkline svg container with inline style width to override global CSS overrides */}
            <div className="flex items-center justify-center border border-border/20 bg-background/50 rounded-xs px-2 py-1 ml-4 shrink-0" style={{ width: "126px", height: "30px" }}>
              <svg width="110" height="20" style={{ width: "110px", height: "20px", display: "block" }} viewBox="0 0 110 20">
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={healthScore >= 75 ? "#57c67a" : healthScore >= 45 ? "#ffb703" : "#f34a4a"}
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* Column 4: Alarms & Controls (20% width) */}
          <div className="flex flex-col gap-0.5 leading-tight pl-2 h-full justify-center w-[20%] shrink-0">
            <div className="flex items-center justify-between font-mono text-[0.58rem] w-full">
              <span className="text-muted-foreground uppercase text-[0.52rem]">Alarms:</span>
              <span className="font-bold text-[0.52rem] shrink-0">
                <span className={battAlarms > 0 ? "text-critical animate-pulse mr-1" : "text-muted-foreground mr-1"}>
                  {battAlarms}B
                </span>
                <span className={fuelAlarms > 0 ? "text-warning" : "text-muted-foreground"}>
                  {fuelAlarms}F
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[0.58rem] mt-0.5 w-full">
              <span className="text-muted-foreground uppercase text-[0.52rem]">Availability:</span>
              <span className="font-bold text-nominal text-[0.52rem] shrink-0">{(100 - (battAlarms * 1.5 + fuelAlarms * 0.5)).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[0.58rem] text-muted-foreground uppercase mt-0.5 w-full">
              <span className="text-[0.52rem]">Bus Plane:</span>
              <span className="font-bold text-primary text-[0.52rem] shrink-0">A: 85 B: 100 C: 100</span>
            </div>
          </div>

        </div>

        {/* Dynamic global status & recovery banner */}
        <div
          onClick={() => {
            if (selectedSatObj?.isAnomalyActive) setShowAnomalyModal(true);
          }}
          className={`mt-2 rounded-sm border py-0.5 font-mono text-[0.58rem] font-bold tracking-[0.04em] text-center uppercase cursor-pointer transition-all ${
            selectedSatObj?.isAnomalyActive
              ? "text-critical border-critical/40 bg-critical/15 animate-pulse hover:bg-critical/25"
              : selectedSatObj && selectedSatObj.soc < 95
                ? "text-warning border-warning/40 bg-warning/10"
                : "text-nominal border-nominal/20 bg-nominal/5"
          }`}
        >
          {selectedSatObj?.isAnomalyActive
            ? `⚠️ CRITICAL: ANOMALY ACTIVE ON NODE ${selectedSatObj.id} — EPS BUS VOLTAGE DROOP (<21.0V) [CLICK TO INSPECT ANOMALY & SOP]`
            : selectedSatObj && selectedSatObj.soc < 95
              ? `RECOVERY PHASE: ANOMALY RESOLVED — BATTERY RECHARGING (${Math.round(selectedSatObj.soc)}%)`
              : "CONSTELLATION OPERATIONAL — ALL PAYLOAD DATA LINKS SECURED"}
        </div>

      </div>

      {/* Interactive Anomaly Diagnosis & Sensor SOP Inspection Modal */}
      {showAnomalyModal && selectedSatObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#080d16] border border-critical/50 rounded-lg shadow-2xl shadow-critical/20 p-5 overflow-hidden font-mono text-foreground">
            
            {/* Decorative top warning bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-critical via-warning to-critical animate-pulse" />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/40 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center size-6 rounded bg-critical/20 border border-critical text-critical font-bold text-xs animate-pulse">
                    ⚠️
                  </span>
                  <h3 className="font-tech text-base font-extrabold tracking-wider text-critical uppercase">
                    CRITICAL ANOMALY ALERT: NODE {selectedSatObj.id}
                  </h3>
                </div>
                <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                  ORION AI Sentinel Telemetry Diagnosis & Standard Operating Procedure (SOP) Advisory
                </p>
              </div>
              <button
                onClick={() => setShowAnomalyModal(false)}
                className="text-muted-foreground hover:text-foreground border border-border/40 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* KPI Badges */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-critical/10 border border-critical/30 rounded p-2 text-center">
                <span className="text-[0.55rem] text-muted-foreground uppercase block">Subsystem</span>
                <span className="text-xs font-bold text-critical uppercase">EPS / POWER</span>
              </div>
              <div className="bg-critical/10 border border-critical/30 rounded p-2 text-center">
                <span className="text-[0.55rem] text-muted-foreground uppercase block">Anomaly Score</span>
                <span className="text-xs font-bold text-critical">0.88 (HIGH)</span>
              </div>
              <div className="bg-warning/10 border border-warning/30 rounded p-2 text-center">
                <span className="text-[0.55rem] text-muted-foreground uppercase block">Fault Profile</span>
                <span className="text-xs font-bold text-warning uppercase">VOLT DROOP</span>
              </div>
              <div className="bg-nominal/10 border border-nominal/30 rounded p-2 text-center">
                <span className="text-[0.55rem] text-muted-foreground uppercase block">Orbit Node</span>
                <span className="text-xs font-bold text-primary uppercase">PLANE A: GSAT-201</span>
              </div>
            </div>

            {/* 1. Anomaly Diagnosis */}
            <div className="bg-background/60 border border-critical/30 rounded p-3 mb-3 space-y-1">
              <span className="font-tech text-xs font-bold text-critical uppercase tracking-wider block flex items-center gap-1.5">
                🚨 Failure Mode & Anomaly Diagnosis
              </span>
              <p className="text-[0.72rem] text-foreground leading-relaxed">
                Primary EPS battery bus voltage collapsed to <span className="text-critical font-bold">{selectedSatObj.busVoltage ? selectedSatObj.busVoltage.toFixed(1) + "V" : "18.93V"}</span> (&lt; 21.0V critical threshold). Indicated cell balancing FET latch-up causing high current discharge under eclipse entry.
              </p>
            </div>

            {/* 2. Recommended SOP Protocol */}
            <div className="bg-background/60 border border-warning/30 rounded p-3 mb-3 space-y-2">
              <span className="font-tech text-xs font-bold text-warning uppercase tracking-wider block flex items-center gap-1.5">
                🛠️ Recommended SOP Recovery Protocol & Actions
              </span>
              <ul className="text-[0.68rem] text-foreground space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-nominal font-bold">✓ Step 1:</span> Isolate Battery Module #3 and switch EPS bus to Auxiliary Solar Array Regulator.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-nominal font-bold">✓ Step 2:</span> Shed Non-Essential Payload Instruments (Command Payload Power Mode 0).
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-nominal font-bold">✓ Step 3:</span> Initiate Automated Battery Thermal Conditioning Loop-1.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-nominal font-bold">✓ Step 4:</span> Authorize Recovery Procedure via Warden Safety Gate (SHA-256 Signature).
                </li>
              </ul>
            </div>

            {/* 3. Basic Sensor Envelopes & Required Parameters */}
            <div className="space-y-1 mb-4">
              <span className="font-tech text-xs font-bold text-foreground uppercase tracking-wider block">
                📊 Required Sensor Telemetry Envelopes
              </span>
              <div className="grid grid-cols-3 gap-2 text-[0.65rem]">
                <div className="bg-surface p-2 rounded border border-critical/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">EPS Bus Voltage</span>
                  <span className="text-critical font-bold text-sm">{selectedSatObj.busVoltage ? selectedSatObj.busVoltage.toFixed(1) + " V" : "18.9 V"}</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &gt; 21.0 V</span>
                </div>

                <div className="bg-surface p-2 rounded border border-warning/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">Battery State of Charge</span>
                  <span className="text-warning font-bold text-sm">{Math.round(selectedSatObj.soc)} %</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &gt; 25.0 %</span>
                </div>

                <div className="bg-surface p-2 rounded border border-warning/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">Battery Temperature</span>
                  <span className="text-warning font-bold text-sm">34.8 °C</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &lt; 32.0 °C</span>
                </div>

                <div className="bg-surface p-2 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">ADCS Pointing Error</span>
                  <span className="text-nominal font-bold text-sm">0.5° R / -0.9° P</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &lt; 1.2°</span>
                </div>

                <div className="bg-surface p-2 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">Comms Downlink Signal</span>
                  <span className="text-nominal font-bold text-sm">-77.0 dBm</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &gt; -105.0 dBm</span>
                </div>

                <div className="bg-surface p-2 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[0.52rem] uppercase">Propellant Tank Pressure</span>
                  <span className="text-nominal font-bold text-sm">152.0 PSI</span>
                  <span className="text-[0.52rem] text-muted-foreground block">Safe Limit: &gt; 100.0 PSI</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <button
                onClick={() => {
                  handleToggleAnomaly(selectedSatObj.id);
                  setShowAnomalyModal(false);
                }}
                className="bg-nominal/15 border border-nominal text-nominal hover:bg-nominal/25 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                ✓ RESOLVE ANOMALY
              </button>

              <button
                onClick={() => {
                  setShowAnomalyModal(false);
                  window.location.href = "/";
                }}
                className="bg-primary/20 border border-primary text-primary hover:bg-primary/30 px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                🛡️ AUTHORIZE RECOVERY VIA WARDEN GATE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
