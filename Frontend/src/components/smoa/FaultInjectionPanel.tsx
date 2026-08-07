import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, ExternalLink, Play, Square, Wrench } from "lucide-react";
import type { FaultInjection } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

const anomalyModes = [
  { mode: "nominal", label: "Nominal Baseline", desc: "Healthy spacecraft telemetry" },
  { mode: "power_droop", label: "EPS Battery Voltage Droop", desc: "Bus droop < 21.0V & cell balancer latched" },
  { mode: "adcs_oscillation", label: "ADCS Torque Ripple", desc: "Wheel 3 rate saturation & 0.8 Hz oscillation" },
  { mode: "thermal_overheat", label: "Thermal Overheat Hazard", desc: "Loop-A pump void & CPU temp > 75°C" },
  { mode: "comms_loss", label: "Comms Packet Loss", desc: "S-Band RSSI drop to -105 dBm & 38% loss" },
  { mode: "thruster_leak", label: "Propulsion Fuel Valve Leak", desc: "Fuel pressure loss to 40 PSI & temp spike" },
  { mode: "sensor_drift", label: "Sensor Bias & Drift", desc: "Progressive sensor drift across EPS & ADCS" },
  { mode: "overfitting", label: "Extreme Stress Anomaly", desc: "Multi-subsystem simultaneous critical fault" },
];

export function FaultInjectionPanel({
  faults: _faults,
  onChange: _onChange,
}: {
  faults: FaultInjection[];
  onChange: (f: FaultInjection[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<string>("nominal");
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const sendAnomaly = async (mode: str) => {
    try {
      setActiveMode(mode);
      const res = await fetch("http://localhost:8000/api/seeding/anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        setStatusMsg(`Backend anomaly state set to: ${mode.toUpperCase()}`);
      }
    } catch {
      setStatusMsg("Failed to reach backend seeding API on port 8000.");
    }
  };

  const toggleSeeding = async (start: boolean) => {
    try {
      const endpoint = start ? "start" : "stop";
      const res = await fetch(`http://localhost:8000/api/seeding/${endpoint}`, { method: "POST" });
      if (res.ok) {
        setIsSeeding(start);
        setStatusMsg(`Seeding ${start ? "STARTED" : "STOPPED"} on backend.`);
      }
    } catch {
      setStatusMsg("Backend connection error.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-sm border border-dashed px-2.5 py-1.5 font-tech text-[0.65rem] font-semibold tracking-[0.09em] uppercase transition-colors duration-150",
          activeMode !== "nominal"
            ? "border-warning bg-warning/12 text-warning"
            : "border-border-strong text-muted-foreground hover:text-foreground",
        )}
      >
        <Bug className="size-3" />
        Data Seeding Control ({activeMode.toUpperCase()})
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/60"
            />
            <motion.aside
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-[23rem] flex-col border-l-2 border-dashed border-cyan-500/70 bg-surface shadow-2xl"
            >
              <div className="panel-header border-b border-dashed border-cyan-500/40">
                <div className="flex items-center gap-1.5">
                  <Wrench className="size-3.5 text-cyan-400" />
                  <h3 className="font-tech text-xs font-semibold tracking-[0.12em] text-cyan-400 uppercase">
                    Data Seeding Control
                  </h3>
                </div>
                <button onClick={() => setOpen(false)} className="label-tech hover:text-foreground">
                  Close
                </button>
              </div>

              <div className="border-b border-border bg-cyan-950/30 px-3 py-2 text.xs text-cyan-300">
                <div className="flex items-center justify-between">
                  <span className="font-tech text-[0.7rem] font-semibold uppercase">Dedicated Seeding Page</span>
                  <a
                    href="http://localhost:5174"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[0.68rem] text-cyan-300 hover:bg-cyan-500/30"
                  >
                    Open Port 5174 <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <p className="mt-1 text-[0.68rem] text-muted-foreground leading-tight">
                  Full data seeding control is isolated to port 5174. All mock client-side fallbacks have been removed.
                </p>
              </div>

              <div className="p-3 border-b border-border space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSeeding(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 py-1.5 font-tech text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                  >
                    <Play className="size-3" /> Start Stream
                  </button>
                  <button
                    onClick={() => toggleSeeding(false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-rose-500/20 border border-rose-500/40 py-1.5 font-tech text-xs font-semibold text-rose-400 hover:bg-rose-500/30"
                  >
                    <Square className="size-3" /> Stop Stream
                  </button>
                </div>
                {statusMsg && <p className="font-tech text-[0.65rem] text-amber-400 truncate">{statusMsg}</p>}
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-thin p-3">
                <p className="font-tech text-[0.68rem] font-semibold tracking-wider text-muted-foreground uppercase">
                  Select Anomaly Generator Profile
                </p>
                {anomalyModes.map((item) => {
                  const isCurrent = activeMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => sendAnomaly(item.mode)}
                      className={cn(
                        "w-full text-left p-2.5 rounded border transition-all duration-150",
                        isCurrent
                          ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                          : "border-border/60 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-tech text-[0.72rem] font-bold tracking-wide uppercase">
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[0.6rem] font-tech px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[0.66rem] text-muted-foreground mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border p-3">
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-cyan-500/40 bg-cyan-950/30 px-3 py-2 font-tech text-[0.7rem] font-bold text-cyan-400 uppercase hover:bg-cyan-500/20"
                >
                  <ExternalLink className="size-3" /> Full Controller App on Port 5174
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
