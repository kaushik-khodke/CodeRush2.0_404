import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetrySimulator } from "./mock";
import { TelemetryDigitalTwin } from "./digitalTwin";
import type { FaultInjection, LinkStatus, TelemetryFrame } from "./types";

export const TELEMETRY_BUFFER = 300;
export const WINDOW_SECONDS = 60;

/**
 * Opens a WebSocket to /ws/telemetry and parses 1 Hz frames into typed state.
 * If the socket cannot be established (no backend yet) the hook degrades to a
 * local simulator and reports `degraded` so the operator is never shown a
 * silently frozen console.
 *
 * TODO(backend): drop the simulator fallback once /ws/telemetry is live.
 */
export function useTelemetry(faults: FaultInjection[], source: "simulator" | "digital-twin" = "simulator") {
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [history, setHistory] = useState<TelemetryFrame[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const faultsRef = useRef(faults);
  faultsRef.current = faults;

  const push = useCallback((frame: TelemetryFrame) => {
    setHistory((prev) => {
      const next = prev.length >= TELEMETRY_BUFFER ? prev.slice(prev.length - TELEMETRY_BUFFER + 1) : prev.slice();
      next.push(frame);
      return next;
    });
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startSimulator = (reason: string) => {
      if (cancelled || interval) return;
      setLastError(reason);
      setStatus("degraded");
      const generator =
        source === "digital-twin" ? new TelemetryDigitalTwin() : new TelemetrySimulator();
      for (let i = 0; i < WINDOW_SECONDS; i += 1) {
        generator.setFaults(faultsRef.current);
        push(generator.next());
      }
      interval = setInterval(() => {
        generator.setFaults(faultsRef.current);
        push(generator.next());
      }, 1000);
    };

    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${proto}//${window.location.host}/ws/telemetry`);

      fallbackTimer = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          socket.close();
          startSimulator("No response from /ws/telemetry — running local digital-twin simulator.");
        }
      }, 2500);

      socket.onopen = () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setLastError(null);
        setStatus("live");
      };
      socket.onmessage = (evt) => {
        try {
          push(JSON.parse(evt.data as string) as TelemetryFrame);
        } catch {
          setLastError("Malformed telemetry frame discarded.");
        }
      };
      socket.onerror = () => {
        startSimulator("Telemetry socket error — running local digital-twin simulator.");
      };
      socket.onclose = () => {
        if (!cancelled && !interval) {
          startSimulator("Telemetry socket closed — running local digital-twin simulator.");
        }
      };
    } catch {
      startSimulator("Telemetry socket unavailable — running local digital-twin simulator.");
    }

    // Supabase Realtime Fallback / Dual Sync
    let supabaseChannel: any = null;
    try {
      import("../supabaseClient").then(({ supabase }) => {
        supabaseChannel = supabase
          .channel("telemetry-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "telemetry_data" },
            (payload) => {
              if (payload.new) {
                const row = payload.new;
                // Convert database row into telemetry frame format if needed
                const frame: TelemetryFrame = {
                  met: row.met || Math.floor(Date.now() / 1000),
                  t: new Date(row.timestamp || Date.now()).getTime(),
                  orbitAngle: row.Orbital_Phase || 0,
                  eclipse: row.Eclipse_Status === 1,
                  power: {
                    busVoltage: row.Battery_Voltage || 28.0,
                    stateOfCharge: row.Battery_SOC || 80.0,
                    arrayPower: row.Power_Generation || 400.0,
                  },
                  thermal: {
                    batteryTemp: row.Battery_Temperature || 20.0,
                    payloadTemp: row.Payload_Temperature || 15.0,
                    radiatorTemp: row.External_Temp || -30.0,
                  },
                  adcs: {
                    roll: row.Roll || 0,
                    pitch: row.Pitch || 0,
                    yaw: row.Yaw || 0,
                    bodyRate: row.Angular_Velocity || 0,
                    wheelRpm: row.Reaction_Wheel_Speed || 2500,
                  },
                  comms: {
                    signalDbm: row.Signal_Strength || -80,
                    packetLoss: row.Packet_Loss || 0,
                    rttSeconds: (row.Latency || 100) / 1000,
                  },
                  anomalyScore: 0.1,
                };
                push(frame);
              }
            }
          )
          .subscribe();
      }).catch(() => {});
    } catch (e) {}

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (interval) clearInterval(interval);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (supabaseChannel) {
        supabaseChannel.unsubscribe();
      }
    };
  }, [push, source]);

  const latest = history.length > 0 ? history[history.length - 1]! : null;

  return { status, history, latest, lastError };
}
