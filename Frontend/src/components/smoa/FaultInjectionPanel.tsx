import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, Trash2, Wrench } from "lucide-react";
import type { FaultInjection, FaultKind, Subsystem } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

const kinds: { kind: FaultKind; label: string; subsystem: Subsystem; help: string }[] = [
  { kind: "sensor_drift", label: "Sensor drift", subsystem: "power", help: "Bias the EPS bus-voltage sensor" },
  { kind: "packet_loss", label: "Packet loss", subsystem: "comms", help: "Drop downlink frames on the S-band link" },
  { kind: "hardware_fault", label: "Hardware fault (ADCS)", subsystem: "adcs", help: "Wheel 3 torque ripple + rate excursion" },
  { kind: "hardware_fault", label: "Hardware fault (Thermal)", subsystem: "thermal", help: "Loop-A pump degradation" },
];

export function FaultInjectionPanel({
  faults,
  onChange,
}: {
  faults: FaultInjection[];
  onChange: (f: FaultInjection[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const magnitudeOf = (kind: FaultKind, subsystem: Subsystem) =>
    faults.find((f) => f.kind === kind && f.subsystem === subsystem)?.magnitude ?? 0;

  const set = (kind: FaultKind, subsystem: Subsystem, magnitude: number) => {
    const rest = faults.filter((f) => !(f.kind === kind && f.subsystem === subsystem));
    onChange(magnitude > 0 ? [...rest, { kind, subsystem, magnitude }] : rest);
  };

  const active = faults.length;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-sm border border-dashed px-2.5 py-1.5 font-tech text-[0.65rem] font-semibold tracking-[0.09em] uppercase transition-colors duration-150",
          active > 0
            ? "border-warning bg-warning/12 text-warning"
            : "border-border-strong text-muted-foreground hover:text-foreground",
        )}
      >
        <Bug className="size-3" />
        Debug · fault injection{active > 0 ? ` (${active})` : ""}
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
              initial={{ x: 340 }}
              animate={{ x: 0 }}
              exit={{ x: 340 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-[21rem] flex-col border-l-2 border-dashed border-warning/70 bg-surface"
            >
              <div className="panel-header border-b border-dashed border-warning/40">
                <div className="flex items-center gap-1.5">
                  <Wrench className="size-3.5 text-warning" />
                  <h3 className="font-tech text-xs font-semibold tracking-[0.12em] text-warning uppercase">
                    Fault Injection · Non-flight
                  </h3>
                </div>
                <button onClick={() => setOpen(false)} className="label-tech hover:text-foreground">
                  Close
                </button>
              </div>

              <p className="border-b border-border bg-warning/8 px-3 py-2 text-[0.72rem] leading-snug text-warning">
                Demo tooling only. Injected faults corrupt the local telemetry stream and never reach the vehicle.
              </p>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin p-3">
                {kinds.map((k) => {
                  const value = magnitudeOf(k.kind, k.subsystem);
                  return (
                    <div key={`${k.kind}-${k.subsystem}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
                          {k.label}
                        </span>
                        <span className="num text-[0.7rem] text-muted-foreground">
                          {(value * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="label-tech mt-0.5 !tracking-normal !normal-case">{k.help}</p>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={value}
                        onChange={(e) => set(k.kind, k.subsystem, Number(e.target.value))}
                        className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-background accent-warning"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border p-3">
                <button
                  onClick={() => onChange([])}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border-strong px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
                >
                  <Trash2 className="size-3" /> Clear all injected faults
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
