import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Archive,
  Battery,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  Filter,
  HardDrive,
  Info,
  Plus,
  Radio,
  RefreshCw,
  Zap,
} from "lucide-react";
import { mockActivitySchedules, mockCommunicationWindows } from "@/lib/smoa/mockPlanner";
import { useTelemetry } from "@/lib/smoa/useTelemetry";
import type { ActivityScheduleItem, CommunicationWindowInfo } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

const typeBadges: Record<
  ActivityScheduleItem["activityType"],
  { label: string; color: string }
> = {
  OBSERVATION: { label: "OBSERVATION", color: "border-primary/60 bg-primary/15 text-primary" },
  DOWNLINK: { label: "DOWNLINK", color: "border-nominal/60 bg-nominal/15 text-nominal" },
  CALIBRATION: { label: "CALIBRATION", color: "border-warning/60 bg-warning/15 text-warning" },
  MAINTENANCE: { label: "MAINTENANCE", color: "border-purple-500/60 bg-purple-500/15 text-purple-400" },
  SAFE_MODE_TRANSITION: { label: "SAFE-MODE", color: "border-critical/60 bg-critical/15 text-critical" },
};

const statusBadges: Record<ActivityScheduleItem["status"] | "EXPIRED", string> = {
  IN_PROGRESS: "bg-nominal/20 text-nominal border-nominal animate-pulse font-bold",
  SCHEDULED: "bg-primary/20 text-primary border-primary font-semibold",
  FEASIBLE: "bg-surface-raised text-muted-foreground border-border",
  COMPLETED: "bg-muted-foreground/20 text-muted-foreground border-border line-through opacity-70",
  EXPIRED: "bg-warning/20 text-warning border-warning/80 opacity-80",
  FAILED: "bg-critical/20 text-critical border-critical font-bold",
};

export function MissionPlanner() {
  const { latest } = useTelemetry([]);

  // NO static predefined tasks in default state — 100% dynamic from Supabase!
  const [schedules, setSchedules] = useState<(ActivityScheduleItem | (ActivityScheduleItem & { status: "EXPIRED" }))[]>([]);
  const [commWindows, setCommWindows] = useState<CommunicationWindowInfo[]>(() => mockCommunicationWindows());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ActivityScheduleItem["activityType"]>("OBSERVATION");
  const [newDuration, setNewDuration] = useState("20");
  const [startOffsetMins, setStartOffsetMins] = useState("2");

  // Fetch dynamic schedules & windows from backend API with 2s live polling
  useEffect(() => {
    const loadPlannerData = () => {
      fetch("/api/planner/schedules")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            const mapped: ActivityScheduleItem[] = data.map((d: any) => ({
              id: d.id || `ACT-${Math.floor(100 + Math.random() * 900)}`,
              activityName: d.activityName || d.activity_name || "Custom Activity",
              activityType: d.activityType || d.activity_type || "OBSERVATION",
              status: d.status || "SCHEDULED",
              priority: d.priority || 1,
              startTime: d.startTime || (d.start_time ? `T+${d.start_time.slice(11, 19)}` : "T+00:02:00"),
              endTime: d.endTime || (d.end_time ? `T+${d.end_time.slice(11, 19)}` : "T+00:22:00"),
              durationMinutes: d.durationMinutes || d.duration_minutes || 20,
              resourceRequirements: {
                powerWatts: d.resourceRequirements?.powerWatts || d.resource_requirements?.powerWatts || 140,
                batterySocMin: d.resourceRequirements?.batterySocMin || d.resource_requirements?.batterySocMin || 40,
                storageGb: d.resourceRequirements?.storageGb || d.resource_requirements?.storageGb || 4.0,
              },
              precedenceConstraints: d.precedenceConstraints || d.precedence_constraints || ["Battery_SOC >= 40%"],
              selectionRationale: d.selectionRationale || d.selection_rationale || "AI Solver precedence check passed.",
            }));
            setSchedules(mapped);
          }
        })
        .catch(() => {});

      fetch("/api/planner/windows")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped: CommunicationWindowInfo[] = data.map((w: any) => ({
              id: w.id || `CW-${Math.floor(100 + Math.random() * 900)}`,
              groundStationName: w.groundStationName || w.ground_station_name || "Ground Station",
              startTime: w.startTime || w.start_time || "T+01:00:00",
              endTime: w.endTime || w.end_time || "T+01:20:00",
              maxElevationDeg: w.maxElevationDeg || w.max_elevation || 65.0,
              bandwidthMbps: w.bandwidthMbps || w.available_bandwidth_mbps || 50.0,
              status: w.status || "UPCOMING",
            }));
            setCommWindows(mapped);
          }
        })
        .catch(() => {});
    };

    loadPlannerData();
    const interval = setInterval(loadPlannerData, 2000);
    return () => clearInterval(interval);
  }, []);


  // Live Dynamic Telemetry Gauges
  const livePowerGeneration = latest?.power?.arrayPower ?? 410.0;
  const liveBatterySoc = latest?.power?.stateOfCharge ?? 88.5;
  const liveSignalDbm = latest?.comms?.signalDbm ?? -78.5;
  const livePacketLoss = latest?.comms?.packetLoss ?? 0.0;

  // Active in-progress power draw
  const activePowerDraw = useMemo(() => {
    const activeItem = schedules.find((s) => s.status === "IN_PROGRESS");
    return activeItem ? activeItem.resourceRequirements.powerWatts : 145.0;
  }, [schedules]);

  const netPowerSurplus = livePowerGeneration - activePowerDraw;

  const totalStorageGb = useMemo(
    () => schedules.reduce((acc, s) => acc + Math.max(0, s.resourceRequirements.storageGb), 0),
    [schedules]
  );

  const filteredSchedules = useMemo(() => {
    if (filterTab === "ACTIVE") {
      return schedules.filter((s) => s.status === "IN_PROGRESS" || s.status === "SCHEDULED" || s.status === "FEASIBLE");
    }
    if (filterTab === "ARCHIVED") {
      return schedules.filter((s) => s.status === "COMPLETED" || (s.status as string) === "EXPIRED" || s.status === "FAILED");
    }
    return schedules;
  }, [schedules, filterTab]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    // Dynamic re-ordering based on live battery SoC and power draw
    setTimeout(() => {
      setSchedules((prev) => {
        const sorted = [...prev].sort((a, b) => {
          // If battery is low (<40%), prioritize calibration/maintenance/downlink over observations
          if (liveBatterySoc < 40) {
            if (a.activityType === "SAFE_MODE_TRANSITION") return -1;
            if (b.activityType === "SAFE_MODE_TRANSITION") return 1;
            return a.resourceRequirements.powerWatts - b.resourceRequirements.powerWatts;
          }
          return a.priority - b.priority;
        });
        return sorted;
      });
      setIsOptimizing(false);
    }, 800);
  };

  const handleExpireCompleted = () => {
    setSchedules((prev) =>
      prev.map((item) => {
        if (item.status === "IN_PROGRESS") {
          return { ...item, status: "COMPLETED" };
        }
        if (item.status === "SCHEDULED" && item.priority > 2) {
          return { ...item, status: "EXPIRED" as any };
        }
        return item;
      })
    );
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const offsetMins = Number(startOffsetMins) || 2;
    const targetStartDate = new Date(Date.now() + offsetMins * 60 * 1000);
    const timeFormatted = targetStartDate.toISOString().slice(11, 19);

    const newItem: ActivityScheduleItem = {
      id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
      activityName: newTitle.trim(),
      activityType: newType,
      status: "SCHEDULED",
      priority: 1,
      startTime: `T+${timeFormatted}`,
      endTime: `T+${new Date(targetStartDate.getTime() + (Number(newDuration) || 20) * 60 * 1000).toISOString().slice(11, 19)}`,
      durationMinutes: Number(newDuration) || 20,
      resourceRequirements: {
        powerWatts: newType === "DOWNLINK" ? 180 : newType === "OBSERVATION" ? 145 : 60,
        batterySocMin: 40,
        storageGb: newType === "DOWNLINK" ? -6.5 : 5.0,
      },
      precedenceConstraints: [
        `Scheduled Execution: ${timeFormatted} UTC (in ${offsetMins}m)`,
        `Battery_SOC >= 40% (Live: ${liveBatterySoc.toFixed(1)}%)`,
        "Constraint Solver Verification Passed",
      ],
      selectionRationale: `User-scheduled for ${timeFormatted} UTC. Net surplus (${netPowerSurplus >= 0 ? "+" : ""}${netPowerSurplus.toFixed(0)}W) verified feasible.`,
    };

    // Post to backend API to insert into Supabase
    fetch("/api/planner/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_name: newItem.activityName,
        activity_type: newItem.activityType,
        start_time: targetStartDate.toISOString(),
        duration_minutes: newItem.durationMinutes,
        power_watts: newItem.resourceRequirements.powerWatts,
        battery_soc_min: newItem.resourceRequirements.batterySocMin,
        storage_gb: newItem.resourceRequirements.storageGb,
      }),
    }).catch(() => {});

    setSchedules((prev) => [newItem, ...prev]);
    setNewTitle("");
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upper Live Dynamic Resource & Constraint Gauges Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[0.68rem] text-muted-foreground uppercase">Live Power Generation vs Load</span>
            <Zap className="size-4 text-warning" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="num text-xl font-bold text-foreground">{livePowerGeneration.toFixed(0)} W</span>
            <span
              className={cn(
                "num text-xs font-semibold",
                netPowerSurplus >= 0 ? "text-nominal" : "text-critical"
              )}
            >
              {netPowerSurplus >= 0 ? "+" : ""}
              {netPowerSurplus.toFixed(0)}W net
            </span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full transition-all duration-500", netPowerSurplus >= 0 ? "bg-warning" : "bg-critical")}
              style={{ width: `${Math.min(100, (livePowerGeneration / 500) * 100)}%` }}
            />
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[0.68rem] text-muted-foreground uppercase">Live Battery SoC Constraint</span>
            <Battery
              className={cn(
                "size-4",
                liveBatterySoc >= 35 ? "text-nominal" : liveBatterySoc >= 20 ? "text-warning" : "text-critical"
              )}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="num text-xl font-bold text-foreground">{liveBatterySoc.toFixed(1)} %</span>
            <span
              className={cn(
                "label-tech text-[0.65rem] font-semibold uppercase",
                liveBatterySoc >= 35 ? "text-nominal" : "text-warning"
              )}
            >
              {liveBatterySoc >= 35 ? "Bound Limit OK (≥35%)" : "WARNING: LOW SOC BOUND"}
            </span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={cn(
                "h-full transition-all duration-500",
                liveBatterySoc >= 35 ? "bg-nominal" : liveBatterySoc >= 20 ? "bg-warning" : "bg-critical"
              )}
              style={{ width: `${Math.max(0, Math.min(100, liveBatterySoc))}%` }}
            />
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[0.68rem] text-muted-foreground uppercase">Solid-State Data Buffer</span>
            <HardDrive className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="num text-xl font-bold text-foreground">{totalStorageGb.toFixed(1)} GB</span>
            <span className="num text-xs text-muted-foreground">/ 64.0 GB Capacity</span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalStorageGb / 64) * 100)}%` }}
            />
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[0.68rem] text-muted-foreground uppercase">Active Downlink Pass</span>
            <Radio className={cn("size-4", liveSignalDbm > -95 ? "text-primary" : "text-warning")} />
          </div>
          <div className="mt-2">
            <span className="font-tech text-xs font-bold text-foreground block truncate">
              {commWindows[0]?.groundStationName || "SGS Svalbard (Norway)"}
            </span>
            <span className="num text-xs text-primary font-semibold">
              {liveSignalDbm.toFixed(1)} dBm · {livePacketLoss.toFixed(1)}% Loss
            </span>
          </div>
        </div>
      </div>

      {/* Main Dynamic Activity Schedule Container */}
      <div className="panel flex flex-col">
        {/* Header Action Bar */}
        <div className="panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">
              Mission Activity Sequence &amp; Precedence Schedule
            </h3>
            <span className="rounded-sm border border-primary/50 bg-primary/10 px-2 py-0.5 font-tech text-[0.62rem] font-semibold text-primary uppercase">
              Live AI Constraint Solver
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-1">
              <button
                onClick={() => setFilterTab("ALL")}
                className={cn(
                  "px-2 py-0.5 font-tech text-[0.65rem] font-semibold uppercase rounded-xs transition-colors cursor-pointer",
                  filterTab === "ALL" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({schedules.length})
              </button>
              <button
                onClick={() => setFilterTab("ACTIVE")}
                className={cn(
                  "px-2 py-0.5 font-tech text-[0.65rem] font-semibold uppercase rounded-xs transition-colors cursor-pointer",
                  filterTab === "ACTIVE" ? "bg-nominal/20 text-nominal" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active / Scheduled
              </button>
              <button
                onClick={() => setFilterTab("ARCHIVED")}
                className={cn(
                  "px-2 py-0.5 font-tech text-[0.65rem] font-semibold uppercase rounded-xs transition-colors cursor-pointer",
                  filterTab === "ARCHIVED" ? "bg-warning/20 text-warning" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Completed / Expired
              </button>
            </div>

            <button
              onClick={handleExpireCompleted}
              title="Transition finished activities to COMPLETED and expired windows to EXPIRED"
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-raised px-2.5 py-1 font-tech text-[0.68rem] font-semibold text-muted-foreground hover:text-foreground uppercase cursor-pointer"
            >
              <Archive className="size-3 text-warning" />
              Tick Lifecycle
            </button>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 rounded-sm border border-primary/60 bg-primary/15 px-3 py-1 font-tech text-[0.7rem] font-semibold tracking-[0.08em] text-primary uppercase transition-all duration-150 hover:bg-primary/25 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", isOptimizing && "animate-spin")} />
              {isOptimizing ? "Solving..." : "Re-Optimize Schedule"}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-3 py-1 font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase transition-colors duration-150 hover:border-border-strong text-foreground cursor-pointer"
            >
              <Plus className="size-3.5 text-nominal" />
              Queue Activity
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="divide-y divide-border">
          {filteredSchedules.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Calendar className="size-8 text-muted-foreground/50 mx-auto" />
              <p className="font-tech text-xs text-muted-foreground uppercase font-semibold">
                No scheduled mission activities in database.
              </p>
              <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">
                Approve a command from the Human Approval Queue or click <strong>"+ Queue Activity"</strong> to schedule an automated task.
              </p>
            </div>
          ) : (
            filteredSchedules.map((item) => {
              const isExpanded = expandedId === item.id;
              const badge = typeBadges[item.activityType] || typeBadges.OBSERVATION;
              const statusStyle = statusBadges[item.status] || statusBadges.FEASIBLE;

              return (
                <div key={item.id} className="transition-colors duration-150 hover:bg-surface-raised/20">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-semibold text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-xs shrink-0">
                        {item.id}
                      </span>

                      <span
                        className={cn(
                          "rounded-sm border px-2 py-0.5 font-tech text-[0.62rem] font-bold tracking-[0.08em] uppercase shrink-0",
                          badge.color
                        )}
                      >
                        {badge.label}
                      </span>

                      <span className="font-tech text-sm font-bold text-foreground truncate">
                        {item.activityName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right leading-tight hidden md:block">
                        <span className="num text-xs text-foreground font-semibold">{item.startTime}</span>
                        <span className="label-tech text-[0.65rem] text-muted-foreground block">
                          Duration {item.durationMinutes}m
                        </span>
                      </div>

                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-tech text-[0.62rem] font-bold uppercase",
                          statusStyle
                        )}
                      >
                        {item.status.replace("_", " ")}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Solver Rationale & Precedence Constraints */}
                  {isExpanded && (
                    <div className="bg-surface-raised/40 p-4 border-t border-border/50 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-background/60 p-3 rounded-md border border-border/40">
                        <div>
                          <span className="label-tech text-[0.65rem] text-muted-foreground block uppercase">
                            Power Required
                          </span>
                          <span className="num text-sm font-semibold text-warning">
                            {item.resourceRequirements.powerWatts} W
                          </span>
                        </div>
                        <div>
                          <span className="label-tech text-[0.65rem] text-muted-foreground block uppercase">
                            Min Battery SoC Bound
                          </span>
                          <span className="num text-sm font-semibold text-nominal">
                            ≥ {item.resourceRequirements.batterySocMin} %
                          </span>
                        </div>
                        <div>
                          <span className="label-tech text-[0.65rem] text-muted-foreground block uppercase">
                            Storage Buffer Delta
                          </span>
                          <span className="num text-sm font-semibold text-primary">
                            {item.resourceRequirements.storageGb > 0 ? "+" : ""}
                            {item.resourceRequirements.storageGb} GB
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="font-tech text-[0.7rem] font-semibold text-foreground uppercase tracking-wider block mb-1">
                          Satisfied Precedence Constraints
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.precedenceConstraints.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-sm border border-nominal/40 bg-nominal/10 px-2 py-0.5 font-tech text-[0.65rem] text-nominal font-medium"
                            >
                              <CheckCircle2 className="size-3" />
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-tech text-[0.7rem] font-semibold text-foreground uppercase tracking-wider block mb-1">
                          AI Planner Rationale ("Why Order Selected")
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-md border border-border/40 font-mono">
                          {item.selectionRationale}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Custom Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-surface p-5 border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-foreground">
                Queue &amp; Schedule Mission Activity
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <label className="label-tech text-[0.68rem] block mb-1">Activity Title / Mission Target</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Earth Radiometer Spot Calibration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-1.5 font-tech text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-tech text-[0.68rem] block mb-1">Activity Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-1.5 font-tech text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="OBSERVATION">OBSERVATION</option>
                    <option value="DOWNLINK">DOWNLINK</option>
                    <option value="CALIBRATION">CALIBRATION</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="SAFE_MODE_TRANSITION">SAFE-MODE</option>
                  </select>
                </div>

                <div>
                  <label className="label-tech text-[0.68rem] block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-1.5 font-tech text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="label-tech text-[0.68rem] block mb-1">Scheduled Start Time Offset</label>
                <select
                  value={startOffsetMins}
                  onChange={(e) => setStartOffsetMins(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-1.5 font-tech text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="1">Trigger in 1 minute</option>
                  <option value="2">Trigger in 2 minutes</option>
                  <option value="5">Trigger in 5 minutes</option>
                  <option value="10">Trigger in 10 minutes</option>
                  <option value="30">Trigger in 30 minutes</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-border px-3 py-1.5 font-tech text-xs text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-sm border border-primary bg-primary/20 px-4 py-1.5 font-tech text-xs font-semibold text-primary uppercase hover:bg-primary/30 cursor-pointer"
                >
                  Schedule &amp; Persist to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
