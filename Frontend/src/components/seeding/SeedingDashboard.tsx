import { useEffect, useMemo, useState } from "react";
import { getApiUrl } from "@/lib/smoa/api";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  Info,
  Layers,
  Navigation,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  Terminal,
  Thermometer,
  X,
  Zap,
} from "lucide-react";

interface StatusResponse {
  is_active: boolean;
  rate_hz: number;
  anomaly_mode: string;
  frame_count: number;
  met: number;
  soc: number;
  custom_params: Record<string, number>;
}

export interface ParameterConfig {
  key: string;
  name: string;
  category: "power" | "thermal" | "comms" | "adcs" | "orbit" | "propulsion" | "payload" | "obc";
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

export const PARAMETER_CONFIGS: ParameterConfig[] = [
  // POWER (8)
  { key: "Battery_Voltage", name: "Battery Voltage Offset", category: "power", min: -15, max: 10, step: 0.5, unit: "V", description: "Nominal: 28.2V. Drop below -6.2V triggers voltage droop anomaly." },
  { key: "Battery_Current", name: "Battery Current Offset", category: "power", min: -10, max: 20, step: 0.5, unit: "A", description: "Nominal: 4.8A." },
  { key: "Battery_SOC", name: "Battery State of Charge Offset", category: "power", min: -50, max: 20, step: 1, unit: "%", description: "Nominal: 88.5%." },
  { key: "Battery_Temperature", name: "Battery Temperature Offset", category: "power", min: -20, max: 40, step: 1, unit: "°C", description: "Nominal: 24.1°C." },
  { key: "Solar_Voltage", name: "Solar Array Voltage Offset", category: "power", min: -20, max: 20, step: 0.5, unit: "V", description: "Nominal: 36.4V." },
  { key: "Solar_Current", name: "Solar Array Current Offset", category: "power", min: -10, max: 15, step: 0.5, unit: "A", description: "Nominal: 12.5A." },
  { key: "Power_Load", name: "System Power Load Offset", category: "power", min: -100, max: 300, step: 5, unit: "W", description: "Nominal: 245.0W." },
  { key: "Power_Generation", name: "Power Generation Offset", category: "power", min: -200, max: 200, step: 10, unit: "W", description: "Nominal: 410.0W." },

  // THERMAL (6)
  { key: "CPU_Temperature", name: "CPU Temperature Offset", category: "thermal", min: -20, max: 50, step: 1, unit: "°C", description: "Nominal: 43.2°C. >70°C triggers thermal hazard anomaly." },
  { key: "Payload_Temperature", name: "Payload Temp Offset", category: "thermal", min: -30, max: 50, step: 1, unit: "°C", description: "Nominal: 29.5°C." },
  { key: "Solar_Panel_Temperature", name: "Solar Panel Temp Offset", category: "thermal", min: -50, max: 50, step: 1, unit: "°C", description: "Nominal: 12.0°C." },
  { key: "System_Temp", name: "Internal System Temp Offset", category: "thermal", min: -20, max: 40, step: 1, unit: "°C", description: "Nominal: 27.8°C." },
  { key: "External_Temp", name: "External Space Temp Offset", category: "thermal", min: -50, max: 50, step: 1, unit: "°C", description: "Nominal: -52.0°C." },
  { key: "Instrument_Temperature", name: "Instrument Temp Offset", category: "thermal", min: -30, max: 40, step: 1, unit: "°C", description: "Nominal: 21.8°C." },

  // COMMS (6)
  { key: "Signal_Strength", name: "Signal Strength (RSSI) Offset", category: "comms", min: -40, max: 20, step: 1, unit: "dBm", description: "Nominal: -78.5 dBm." },
  { key: "Downlink_Rate", name: "Downlink Data Rate Offset", category: "comms", min: -20, max: 20, step: 0.5, unit: "Mbps", description: "Nominal: 24.8 Mbps." },
  { key: "Uplink_Rate", name: "Uplink Data Rate Offset", category: "comms", min: -5, max: 10, step: 0.2, unit: "Mbps", description: "Nominal: 2.1 Mbps." },
  { key: "Packet_Loss", name: "Packet Loss Rate Offset", category: "comms", min: 0, max: 90, step: 1, unit: "%", description: "Nominal: 0.1%. >20% triggers comms warning." },
  { key: "Latency", name: "Comms RTT Latency Offset", category: "comms", min: -50, max: 500, step: 10, unit: "ms", description: "Nominal: 115 ms." },
  { key: "Communication_Window", name: "Comms Window State Offset", category: "comms", min: -1, max: 1, step: 1, unit: "Flag", description: "1 = In Contact, 0 = LOS." },

  // ADCS (10)
  { key: "Roll", name: "Roll Attitude Offset", category: "adcs", min: -45, max: 45, step: 0.5, unit: "°", description: "Nominal: 0.2°." },
  { key: "Pitch", name: "Pitch Attitude Offset", category: "adcs", min: -45, max: 45, step: 0.5, unit: "°", description: "Nominal: -0.1°." },
  { key: "Yaw", name: "Yaw Attitude Offset", category: "adcs", min: -180, max: 180, step: 1, unit: "°", description: "Nominal: 0.05°." },
  { key: "Angular_Velocity", name: "Angular Body Rate Offset", category: "adcs", min: -2, max: 2, step: 0.05, unit: "°/s", description: "Nominal: 0.04°/s." },
  { key: "Reaction_Wheel_Speed", name: "Reaction Wheel Speed Offset", category: "adcs", min: -1000, max: 4000, step: 100, unit: "RPM", description: "Nominal: 2480 RPM. >4200 RPM triggers wheel saturation." },
  { key: "Gyroscope_X", name: "Gyroscope X Rate Offset", category: "adcs", min: -0.05, max: 0.05, step: 0.001, unit: "rad/s", description: "Nominal: 0.0009 rad/s." },
  { key: "Gyroscope_Y", name: "Gyroscope Y Rate Offset", category: "adcs", min: -0.05, max: 0.05, step: 0.001, unit: "rad/s", description: "Nominal: 0.0011 rad/s." },
  { key: "Gyroscope_Z", name: "Gyroscope Z Rate Offset", category: "adcs", min: -0.05, max: 0.05, step: 0.001, unit: "rad/s", description: "Nominal: 0.0008 rad/s." },
  { key: "Magnetometer", name: "Magnetometer Field Offset", category: "adcs", min: -30, max: 30, step: 0.5, unit: "µT", description: "Nominal: 44.8 µT." },
  { key: "Star_Tracker_Status", name: "Star Tracker Lock Offset", category: "adcs", min: -1, max: 1, step: 1, unit: "Lock", description: "1 = Nominal Lock, 0 = Lost Lock." },

  // ORBIT (6)
  { key: "Altitude", name: "Orbital Altitude Offset", category: "orbit", min: -100, max: 200, step: 5, unit: "km", description: "Nominal: 521.4 km." },
  { key: "Velocity", name: "Orbital Velocity Offset", category: "orbit", min: -2, max: 2, step: 0.1, unit: "km/s", description: "Nominal: 7.62 km/s." },
  { key: "Latitude", name: "Sub-satellite Lat Offset", category: "orbit", min: -90, max: 90, step: 1, unit: "°", description: "Nominal: 12.4°." },
  { key: "Longitude", name: "Sub-satellite Lon Offset", category: "orbit", min: -180, max: 180, step: 1, unit: "°", description: "Nominal: -45.2°." },
  { key: "Orbital_Phase", name: "Orbital Phase Angle Offset", category: "orbit", min: -180, max: 180, step: 5, unit: "°", description: "Nominal: 120.0°." },
  { key: "Eclipse_Status", name: "Eclipse Override State", category: "orbit", min: -1, max: 1, step: 1, unit: "State", description: "1 = Force Eclipse, -1 = Force Sun." },

  // PROPULSION (5)
  { key: "Fuel_Level", name: "Propellant Tank Level Offset", category: "propulsion", min: -50, max: 15, step: 1, unit: "%", description: "Nominal: 85.0%." },
  { key: "Thruster_Temperature", name: "Thruster Manifold Temp Offset", category: "propulsion", min: -20, max: 100, step: 2, unit: "°C", description: "Nominal: 39.5°C." },
  { key: "Thruster_Status", name: "Thruster Solenoid Valve Offset", category: "propulsion", min: -1, max: 1, step: 1, unit: "State", description: "1 = Firing, 0 = Closed." },
  { key: "Fuel_Pressure", name: "Fuel Line Pressure Offset", category: "propulsion", min: -120, max: 50, step: 2, unit: "PSI", description: "Nominal: 152.0 PSI. <100 PSI triggers propulsion leak." },
  { key: "Burn_Duration", name: "Maneuver Burn Duration", category: "propulsion", min: 0, max: 120, step: 5, unit: "s", description: "Nominal: 0.0s." },

  // PAYLOAD (5)
  { key: "Camera_Status", name: "Camera Instrument Status Offset", category: "payload", min: -1, max: 1, step: 1, unit: "State", description: "1 = Operational, 0 = Offline." },
  { key: "Instrument_Power", name: "Payload Instrument Power Offset", category: "payload", min: -50, max: 50, step: 2, unit: "W", description: "Nominal: 84.0W." },
  { key: "Data_Collection_Rate", name: "Instrument Data Rate Offset", category: "payload", min: -10, max: 20, step: 0.5, unit: "MB/s", description: "Nominal: 10.2 MB/s." },
  { key: "Payload_Mode", name: "Payload Mode Selector Offset", category: "payload", min: -2, max: 2, step: 1, unit: "Mode", description: "Mode 0-3 selector." },
  { key: "Observation_Window", name: "Science Target In View Offset", category: "payload", min: -1, max: 1, step: 1, unit: "Flag", description: "1 = Target in view." },

  // OBC & SYSTEM HEALTH (6)
  { key: "CPU_Usage", name: "OBC CPU Utilization Offset", category: "obc", min: -30, max: 60, step: 2, unit: "%", description: "Nominal: 34.2%." },
  { key: "RAM_Usage", name: "OBC RAM Memory Load Offset", category: "obc", min: -30, max: 50, step: 2, unit: "%", description: "Nominal: 39.8%." },
  { key: "Storage_Usage", name: "Storage Disk Usage Offset", category: "obc", min: -30, max: 40, step: 2, unit: "%", description: "Nominal: 54.1%." },
  { key: "Process_Health", name: "System Process Health Offset", category: "obc", min: -1, max: 1, step: 1, unit: "State", description: "1 = Nominal, 0 = Degraded." },
  { key: "Software_Version", name: "Flight Software Build Offset", category: "obc", min: -1, max: 1, step: 0.1, unit: "Ver", description: "Nominal: v2.1." },
  { key: "Mission_Phase", name: "Mission Operations Phase Offset", category: "obc", min: -2, max: 3, step: 1, unit: "Phase", description: "Phase 1-4 selector." },
];

const CATEGORY_META = {
  all: { label: "All (52)", icon: Sliders, color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40" },
  power: { label: "Power (8)", icon: Zap, color: "text-amber-400 border-amber-500/40 bg-amber-950/40" },
  thermal: { label: "Thermal (6)", icon: Thermometer, color: "text-rose-400 border-rose-500/40 bg-rose-950/40" },
  comms: { label: "Comms (6)", icon: Radio, color: "text-purple-400 border-purple-500/40 bg-purple-950/40" },
  adcs: { label: "ADCS (10)", icon: Compass, color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40" },
  orbit: { label: "Orbit (6)", icon: Navigation, color: "text-blue-400 border-blue-500/40 bg-blue-950/40" },
  propulsion: { label: "Propulsion (5)", icon: Flame, color: "text-orange-400 border-orange-500/40 bg-orange-950/40" },
  payload: { label: "Payload (5)", icon: Camera, color: "text-teal-400 border-teal-500/40 bg-teal-950/40" },
  obc: { label: "OBC (6)", icon: Cpu, color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/40" },
};

const ANOMALY_CARDS = [
  {
    mode: "nominal",
    title: "Nominal Operations Baseline",
    subsystem: "ALL SYSTEMS",
    severity: "HEALTHY",
    color: "emerald",
    desc: "Baseline spacecraft operations. All telemetry parameters within certified envelopes.",
  },
  {
    mode: "power_droop",
    title: "EPS Battery Bus Voltage Droop",
    subsystem: "POWER",
    severity: "CRITICAL",
    color: "amber",
    desc: "Simulates battery terminal voltage collapse (< 21.0 V) and cell balancing FET latch-up under eclipse.",
  },
  {
    mode: "adcs_oscillation",
    title: "ADCS Wheel Torque Ripple & Saturation",
    subsystem: "ADCS",
    severity: "WARNING",
    color: "cyan",
    desc: "Reaction wheel 3 bearing lubricant breakdown producing 0.8 Hz torque ripple and pointing instability.",
  },
  {
    mode: "thermal_overheat",
    title: "Thermal Overheat & Coolant Loop Loss",
    subsystem: "THERMAL",
    severity: "CRITICAL",
    color: "rose",
    desc: "Loop-A coolant flow void inducing flight computer CPU temperature rise above 78°C limit.",
  },
  {
    mode: "comms_loss",
    title: "Comms S-Band High Packet Loss",
    subsystem: "COMMS",
    severity: "WARNING",
    color: "purple",
    desc: "Signal attenuation (-105 dBm) causing 38% frame corruption and elevated downlink latency.",
  },
  {
    mode: "thruster_leak",
    title: "Propulsion Thruster Fuel Leak",
    subsystem: "PROPULSION",
    severity: "CRITICAL",
    color: "orange",
    desc: "Fuel feed valve solenoid failure resulting in pressure drop to 40 PSI and thermal spike.",
  },
  {
    mode: "sensor_drift",
    title: "Sensor Bias & Calibration Drift",
    subsystem: "SENSORS",
    severity: "MEDIUM",
    color: "blue",
    desc: "Monotonically increasing sensor calibration bias on power bus voltage and gyro rate registers.",
  },
  {
    mode: "overfitting",
    title: "Multi-Subsystem Stress Test",
    subsystem: "OVERLOAD",
    severity: "CRITICAL",
    color: "red",
    desc: "Simultaneous compound failure across Power, Thermal, ADCS, and Comms for model boundary testing.",
  },
  {
    mode: "reaction_wheel_desat",
    title: "ADCS Wheel Momentum Saturation (Auto-Heal)",
    subsystem: "ADCS (AUTO)",
    severity: "LOW",
    color: "emerald",
    desc: "Reaction wheel 3 reaches 5200 RPM. Agentic AI automatically fires B-field magnetorquer coils to dump momentum without human intervention.",
  },
  {
    mode: "ssr_buffer_flush",
    title: "Solid-State Recorder 92% Storage Capacity (Auto-Heal)",
    subsystem: "DATA (AUTO)",
    severity: "LOW",
    color: "teal",
    desc: "Data recorder reaches 44.1 GB (92%). Agentic AI automatically compresses archives and flushes memory cache without human intervention.",
  },
  {
    mode: "payload_heater_cycle",
    title: "Payload Camera Cold Excursion (-5.2°C) (Auto-Heal)",
    subsystem: "THERMAL (AUTO)",
    severity: "LOW",
    color: "cyan",
    desc: "Payload camera drops to -5.2°C in orbital eclipse shadow. Agentic AI automatically cycles Zone-1 operational heater without human intervention.",
  },
];

export function SeedingDashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // 52 Parameter Offsets State
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchStatus = async () => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/status"));
      if (res.ok) {
        const data: StatusResponse = await res.json();
        setStatus(data);
        setBackendOnline(true);
        if (data.custom_params) {
          setOffsets(data.custom_params);
        }
        return;
      }
    } catch {
      // Backend unreachable or waking up on Render
    }
    setBackendOnline(false);
    setStatus((prev) => prev || {
      is_seeding: true,
      active_anomaly: "NOMINAL",
      rate_hz: 1.0,
      met_sec: Math.floor(Date.now() / 1000) % 86400,
      frame_counter: 1280,
      custom_params: {},
    });
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 2000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 100)]);
  };

  const handleStart = async () => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/start"), { method: "POST" });
      if (res.ok) {
        addLog("▶ TELEMETRY DATA SEEDING STARTED.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Failed to reach backend.");
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/stop"), { method: "POST" });
      if (res.ok) {
        addLog("⏹ TELEMETRY DATA SEEDING STOPPED COMPLETELY.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Failed to reach backend.");
    }
  };

  const handleStep = async () => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/step"), { method: "POST" });
      if (res.ok) {
        addLog("⏭ STEPPED 1 TELEMETRY FRAME.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Error stepping frame.");
    }
  };

  const handleClear = async () => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/clear"), { method: "POST" });
      if (res.ok) {
        setOffsets({});
        addLog("🔄 PURGED TELEMETRY BUFFER & RESET SEEDING STATE.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Error resetting state.");
    }
  };

  const handleSetRate = async (rate_hz: number) => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/rate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_hz }),
      });
      if (res.ok) {
        addLog(`⚡ STREAM RATE UPDATED TO ${rate_hz} Hz.`);
        fetchStatus();
      }
    } catch {
      addLog("❌ Error updating rate.");
    }
  };

  const handleSetAnomaly = async (mode: string) => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/anomaly"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        addLog(`⚠️ ANOMALY GENERATOR PROFILE ACTIVE: [${mode.toUpperCase()}]`);
        fetchStatus();
      }
    } catch {
      addLog("❌ Error applying anomaly mode.");
    }
  };

  const handleApplyCustomParams = async (paramsToSend = offsets) => {
    try {
      const res = await fetch(getApiUrl("/api/seeding/custom"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: paramsToSend }),
      });
      if (res.ok) {
        const activeCount = Object.values(paramsToSend).filter((v) => Math.abs(v) > 0.0001).length;
        addLog(`🎛 ${activeCount} SENSOR OFFSETS APPLIED LIVE TO TELEMETRY STREAM.`);
        fetchStatus();
      }
    } catch {
      addLog("❌ Error applying custom parameters.");
    }
  };

  const handleSliderChange = (key: string, val: number) => {
    const updated = { ...offsets, [key]: val };
    setOffsets(updated);
    handleApplyCustomParams(updated);
  };

  const handleResetAllZero = () => {
    setOffsets({});
    handleApplyCustomParams({});
    addLog("🔄 ALL 52 SENSOR OFFSETS RESET TO ZERO BASELINE.");
  };

  const activeOffsetCount = useMemo(() => {
    return Object.values(offsets).filter((val) => Math.abs(val) > 0.0001).length;
  }, [offsets]);

  const filteredParameters = useMemo(() => {
    return PARAMETER_CONFIGS.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-4 md:p-6 selection:bg-cyan-500/30">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Radio className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-tech text-xl font-bold tracking-wider uppercase text-cyan-400">
                  SMOA Spacecraft Digital Twin Simulation Controller
                </h1>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[0.65rem] font-tech font-semibold text-cyan-300">
                  PORT 5174 · BASILISK TWIN STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dedicated Basilisk Physics Engine &amp; Subsystem Simulation Control Console · Supabase Realtime CDC Active
              </p>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-tech text-xs font-semibold uppercase tracking-wider transition-all"
          >
            Main Mission Console (Port 5173) <ExternalLink className="size-3.5" />
          </a>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-tech font-semibold uppercase ${
              backendOnline
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                : "bg-amber-950/40 border-amber-500/40 text-amber-400"
            }`}
          >
            <span className={`size-2 rounded-full ${backendOnline ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
            Backend API: {backendOnline ? "CONNECTED (8000)" : "SIMULATED FEED"}
          </div>
        </div>
      </header>

      {/* Seeding Control Banner */}
      <div className="mt-6 p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Stream Status */}
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg border ${
              status?.is_active
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800/80 border-slate-700 text-slate-400"
            }`}
          >
            <Activity className={`size-6 ${status?.is_active ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <span className="text-[0.65rem] font-tech uppercase tracking-wider text-slate-400 block">
              Seeding Stream Status
            </span>
            <span
              className={`font-tech text-sm font-bold uppercase tracking-wider ${
                status?.is_active ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {status?.is_active ? "STREAMING LIVE" : "STREAM STOPPED"}
            </span>
          </div>
        </div>

        {/* Active Profile */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-400">
            <Zap className="size-6" />
          </div>
          <div>
            <span className="text-[0.65rem] font-tech uppercase tracking-wider text-slate-400 block">
              Active Anomaly Profile
            </span>
            <span className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-300">
              {status?.anomaly_mode || "nominal"}
            </span>
          </div>
        </div>

        {/* Telemetry Counter */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-400">
            <Gauge className="size-6" />
          </div>
          <div>
            <span className="text-[0.65rem] font-tech uppercase tracking-wider text-slate-400 block">
              MET &amp; Frame Counter
            </span>
            <span className="font-tech text-sm font-bold uppercase tracking-wider text-purple-300">
              MET: {status?.met ?? "---"}s | Frames: {status?.frame_count ?? 0}
            </span>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] font-tech uppercase tracking-wider text-slate-400">
            Master Stream Controls
          </span>
          <div className="grid grid-cols-2 gap-2">
            {!status?.is_active ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all"
              >
                <Play className="size-4 fill-slate-950" /> Start Seeding
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all"
              >
                <Pause className="size-4 fill-white" /> Stop Seeding
              </button>
            )}

            <button
              onClick={handleStep}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech font-bold text-xs uppercase tracking-wider transition-all"
            >
              <RefreshCw className="size-3.5" /> Step 1
            </button>
          </div>
        </div>
      </div>

      {/* Stream Rate & Reset Row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-tech text-xs text-slate-400 uppercase font-semibold">Stream Frequency Rate:</span>
          {[0.5, 1.0, 2.0, 5.0, 10.0].map((r) => (
            <button
              key={r}
              onClick={() => handleSetRate(r)}
              className={`px-3 py-1 rounded text-xs font-tech font-semibold transition-all ${
                status?.rate_hz === r
                  ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {r} Hz
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-tech font-bold text-xs uppercase tracking-wider transition-all"
        >
          <RotateCcw className="size-3.5" /> Purge DB &amp; Reset
        </button>
      </div>

      {/* Preset Anomaly Generators Row */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-tech text-sm font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
            <ShieldAlert className="size-4" /> Preset Anomaly Generator Profiles
          </h2>
          <span className="text-xs text-slate-400">Click any profile to instantly inject standard fault signatures</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ANOMALY_CARDS.map((card) => {
            const isActive = status?.anomaly_mode === card.mode;
            return (
              <div
                key={card.mode}
                onClick={() => handleSetAnomaly(card.mode)}
                className={`cursor-pointer p-3.5 rounded-lg border transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/50"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[0.62rem] font-tech font-bold uppercase tracking-wider text-cyan-400">
                      {card.subsystem}
                    </span>
                    <h3 className="font-tech text-xs font-bold text-white mt-0.5">{card.title}</h3>
                  </div>
                  {isActive ? (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-tech text-[0.6rem] font-bold">
                      ACTIVE
                    </span>
                  ) : (
                    <span
                      className={`px-1.5 py-0.5 rounded font-tech text-[0.6rem] font-semibold ${
                        card.severity === "HEALTHY"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : card.severity === "CRITICAL"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {card.severity}
                    </span>
                  )}
                </div>
                <p className="text-[0.7rem] text-slate-400 mt-1.5 leading-tight line-clamp-2">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL 52-PARAMETER SENSOR OFFSETTER SECTION */}
      <div className="mt-8 p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5">
        {/* Header & Status Counter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-tech text-base font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                <Sliders className="size-5" /> Fine-Tune Live Sensor Offsets (Full 52 Dataset Parameters)
              </h2>
              {activeOffsetCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-tech text-xs font-bold animate-pulse">
                  {activeOffsetCount} / 52 Active Offsets
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manually calibrate or offset ANY of the 52 dataset parameters. Offsets directly alter live telemetry frames and trigger real-time ML Sentinel anomalies!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleApplyCustomParams()}
              className="py-2 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5 fill-slate-950" /> Apply Offsets Live
            </button>

            <button
              onClick={handleResetAllZero}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-tech font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" /> Reset Zero All (52)
            </button>
          </div>
        </div>

        {/* Quick Inject Presets Row */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-2">
          <span className="font-tech text-[0.68rem] font-bold text-cyan-300 uppercase tracking-wider block">
            ⚡ Quick Parameter Injection Shortcuts:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const updated = { ...offsets, Battery_Voltage: -10 };
                setOffsets(updated);
                handleApplyCustomParams(updated);
              }}
              className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-tech text-[0.7rem] font-semibold transition-all"
            >
              ⚡ Voltage Droop (-10V)
            </button>

            <button
              onClick={() => {
                const updated = { ...offsets, CPU_Temperature: 30 };
                setOffsets(updated);
                handleApplyCustomParams(updated);
              }}
              className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-tech text-[0.7rem] font-semibold transition-all"
            >
              🔥 CPU Overheat (+30°C)
            </button>

            <button
              onClick={() => {
                const updated = { ...offsets, Reaction_Wheel_Speed: 2500 };
                setOffsets(updated);
                handleApplyCustomParams(updated);
              }}
              className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-tech text-[0.7rem] font-semibold transition-all"
            >
              ⚙️ Wheel Saturation (+2500 RPM)
            </button>

            <button
              onClick={() => {
                const updated = { ...offsets, Fuel_Pressure: -60 };
                setOffsets(updated);
                handleApplyCustomParams(updated);
              }}
              className="px-2.5 py-1 rounded bg-orange-950/60 hover:bg-orange-900/80 border border-orange-500/40 text-orange-300 font-tech text-[0.7rem] font-semibold transition-all"
            >
              ⛽ Fuel Line Pressure Drop (-60 PSI)
            </button>

            <button
              onClick={() => {
                const updated = { ...offsets, Packet_Loss: 45 };
                setOffsets(updated);
                handleApplyCustomParams(updated);
              }}
              className="px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-tech text-[0.7rem] font-semibold transition-all"
            >
              📡 Comms Packet Corruption (+45%)
            </button>
          </div>
        </div>

        {/* Filter Controls: Search Input & Category Pills */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
              const Icon = meta.icon;
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech font-semibold uppercase transition-all ${
                    isSelected
                      ? `${meta.color} font-bold shadow-md`
                      : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search 52 parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-tech"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* 52 Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[640px] overflow-y-auto pr-1 scroll-thin">
          {filteredParameters.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800 text-slate-500 font-tech text-xs">
              No parameters match &quot;{searchQuery}&quot; in {selectedCategory.toUpperCase()} subsystem.
            </div>
          ) : (
            filteredParameters.map((p) => {
              const currentVal = offsets[p.key] ?? 0;
              const isModified = Math.abs(currentVal) > 0.0001;

              return (
                <div
                  key={p.key}
                  className={`p-3.5 rounded-lg border transition-all duration-200 ${
                    isModified
                      ? "bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/40"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <span className="text-[0.6rem] font-mono text-cyan-400/80 font-semibold block uppercase">
                        {p.key}
                      </span>
                      <h4 className="font-tech text-xs font-bold text-slate-100">{p.name}</h4>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        isModified
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                          : "bg-slate-800/80 border-slate-700 text-slate-400"
                      }`}
                    >
                      {currentVal > 0 ? `+${currentVal}` : currentVal} {p.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={currentVal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleSliderChange(p.key, val);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400 cursor-pointer mt-3"
                  />

                  <div className="flex items-center justify-between text-[0.65rem] text-slate-500 font-mono mt-1">
                    <span>min {p.min}</span>
                    <button
                      onClick={() => handleSliderChange(p.key, 0)}
                      className={`hover:underline font-bold ${isModified ? "text-cyan-400" : "text-slate-600"}`}
                    >
                      [Reset 0]
                    </button>
                    <span>max +{p.max}</span>
                  </div>

                  <p className="text-[0.68rem] text-slate-400/80 leading-tight mt-1.5 border-t border-slate-800/50 pt-1.5">
                    {p.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controller Audit Log */}
      <div className="mt-6 p-4 rounded-lg bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <h2 className="font-tech text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
          <Terminal className="size-4 text-purple-400" /> Controller Audit Log
        </h2>
        <div className="h-40 overflow-y-auto font-mono text-[0.7rem] space-y-1 text-slate-400 scroll-thin pr-1">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">No events logged yet.</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="leading-snug border-b border-slate-800/40 pb-0.5">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SeedingDashboard;
