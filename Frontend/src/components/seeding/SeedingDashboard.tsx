import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  Info,
  Layers,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Terminal,
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
];

export function SeedingDashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Fine-tuning offsets
  const [voltageOffset, setVoltageOffset] = useState<number>(0);
  const [tempOffset, setTempOffset] = useState<number>(0);
  const [wheelRpmOffset, setWheelRpmOffset] = useState<number>(0);
  const [packetLossOffset, setPacketLossOffset] = useState<number>(0);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/seeding/status");
      if (res.ok) {
        const data: StatusResponse = await res.json();
        setStatus(data);
        setBackendOnline(true);
        if (data.custom_params) {
          if (data.custom_params.voltage_offset !== undefined) setVoltageOffset(data.custom_params.voltage_offset);
          if (data.custom_params.temp_offset !== undefined) setTempOffset(data.custom_params.temp_offset);
          if (data.custom_params.wheel_rpm_offset !== undefined) setWheelRpmOffset(data.custom_params.wheel_rpm_offset);
          if (data.custom_params.packet_loss_offset !== undefined) setPacketLossOffset(data.custom_params.packet_loss_offset);
        }
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
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
      const res = await fetch("http://localhost:8000/api/seeding/start", { method: "POST" });
      if (res.ok) {
        addLog("▶ TELEMETRY DATA SEEDING STARTED.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Failed to reach backend at http://localhost:8000.");
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/seeding/stop", { method: "POST" });
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
      const res = await fetch("http://localhost:8000/api/seeding/step", { method: "POST" });
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
      const res = await fetch("http://localhost:8000/api/seeding/clear", { method: "POST" });
      if (res.ok) {
        setVoltageOffset(0);
        setTempOffset(0);
        setWheelRpmOffset(0);
        setPacketLossOffset(0);
        addLog("🔄 PURGED TELEMETRY BUFFER & RESET SEEDING STATE.");
        fetchStatus();
      }
    } catch {
      addLog("❌ Error resetting state.");
    }
  };

  const handleSetRate = async (rate_hz: number) => {
    try {
      const res = await fetch("http://localhost:8000/api/seeding/rate", {
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
      const res = await fetch("http://localhost:8000/api/seeding/anomaly", {
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

  const handleApplyCustomParams = async (vOff = voltageOffset, tOff = tempOffset, rpmOff = wheelRpmOffset, lossOff = packetLossOffset) => {
    try {
      const params = {
        voltage_offset: vOff,
        temp_offset: tOff,
        cpu_temp_offset: tOff,
        wheel_rpm_offset: rpmOff,
        packet_loss_offset: lossOff,
      };
      const res = await fetch("http://localhost:8000/api/seeding/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      if (res.ok) {
        addLog(`🎛 SENSOR OFFSETS APPLIED: V:${vOff}V, Temp:+${tOff}°C, RPM:+${rpmOff}, Loss:+${lossOff}%`);
        fetchStatus();
      }
    } catch {
      addLog("❌ Error applying custom parameters.");
    }
  };

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
                  SMOA Spacecraft Telemetry Data Seeding Controller
                </h1>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[0.65rem] font-tech font-semibold text-cyan-300">
                  PORT 5174
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Isolated Data Seeding Engine · Supabase Database Sync & Anomaly Generator Pipeline
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
                : "bg-rose-950/40 border-rose-500/40 text-rose-400"
            }`}
          >
            <span className={`size-2 rounded-full ${backendOnline ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
            Backend API: {backendOnline ? "CONNECTED (8000)" : "DISCONNECTED"}
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

      {/* Main Grid: Anomaly Generators & Fine Tuning */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Generator Profiles (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tech text-sm font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
              <ShieldAlert className="size-4" /> Preset Anomaly Generators
            </h2>
            <span className="text-xs text-slate-400">Click any profile to instantly inject anomaly into live stream</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ANOMALY_CARDS.map((card) => {
              const isActive = status?.anomaly_mode === card.mode;
              return (
                <div
                  key={card.mode}
                  onClick={() => handleSetAnomaly(card.mode)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? "bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[0.65rem] font-tech font-bold uppercase tracking-wider text-cyan-400">
                        {card.subsystem}
                      </span>
                      <h3 className="font-tech text-sm font-bold text-white mt-0.5">{card.title}</h3>
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-tech text-[0.65rem] font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded font-tech text-[0.65rem] font-semibold ${
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
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Custom Fine-Tuning & Live Explanation */}
        <div className="space-y-6">
          {/* Custom Sliders */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="font-tech text-sm font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                <Sliders className="size-4" /> Fine-Tune Live Sensor Offsets
              </h2>
            </div>

            {/* Explanation box */}
            <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2">
              <Info className="size-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 font-tech block uppercase">What is the Sensor Offsetter?</span>
                Allows precise manual calibration testing. Dragging <strong>Voltage Offset to -10V</strong> or <strong>CPU Temp to +30°C</strong> directly alters numeric graph lines on the main console (Port 5173) and triggers dynamic ML Sentinel alarms!
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-tech">
                  <span>Battery Voltage Offset</span>
                  <span className="text-cyan-400 font-bold">{voltageOffset > 0 ? `+${voltageOffset}` : voltageOffset} V</span>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={5}
                  step={0.5}
                  value={voltageOffset}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoltageOffset(val);
                    handleApplyCustomParams(val, tempOffset, wheelRpmOffset, packetLossOffset);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400 cursor-pointer mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-tech">
                  <span>CPU Temperature Offset</span>
                  <span className="text-cyan-400 font-bold">{tempOffset > 0 ? `+${tempOffset}` : tempOffset} °C</span>
                </div>
                <input
                  type="range"
                  min={-10}
                  max={40}
                  step={1}
                  value={tempOffset}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTempOffset(val);
                    handleApplyCustomParams(voltageOffset, val, wheelRpmOffset, packetLossOffset);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400 cursor-pointer mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-tech">
                  <span>Reaction Wheel RPM Offset</span>
                  <span className="text-cyan-400 font-bold">{wheelRpmOffset > 0 ? `+${wheelRpmOffset}` : wheelRpmOffset} RPM</span>
                </div>
                <input
                  type="range"
                  min={-1000}
                  max={3000}
                  step={100}
                  value={wheelRpmOffset}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setWheelRpmOffset(val);
                    handleApplyCustomParams(voltageOffset, tempOffset, val, packetLossOffset);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400 cursor-pointer mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-tech">
                  <span>Packet Loss Offset</span>
                  <span className="text-cyan-400 font-bold">+{packetLossOffset}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={packetLossOffset}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPacketLossOffset(val);
                    handleApplyCustomParams(voltageOffset, tempOffset, wheelRpmOffset, val);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400 cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleApplyCustomParams()}
                className="flex-1 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Apply Offsets Live
              </button>

              <button
                onClick={() => {
                  setVoltageOffset(0);
                  setTempOffset(0);
                  setWheelRpmOffset(0);
                  setPacketLossOffset(0);
                  handleApplyCustomParams(0, 0, 0, 0);
                }}
                className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-tech font-bold text-xs uppercase tracking-wider transition-all"
              >
                Reset Zero
              </button>
            </div>
          </div>

          {/* Console Audit Log */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h2 className="font-tech text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
              <Terminal className="size-4 text-purple-400" /> Controller Audit Log
            </h2>
            <div className="h-44 overflow-y-auto font-mono text-[0.7rem] space-y-1 text-slate-400 scroll-thin pr-1">
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
      </div>
    </div>
  );
}
