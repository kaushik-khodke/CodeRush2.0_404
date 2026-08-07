import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetrySimulator } from "./mock";
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
export function useTelemetry(faults: FaultInjection[]) {
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
      const sim = new TelemetrySimulator();
      for (let i = 0; i < WINDOW_SECONDS; i += 1) {
        sim.setFaults(faultsRef.current);
        push(sim.next());
      }
      interval = setInterval(() => {
        sim.setFaults(faultsRef.current);
        push(sim.next());
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

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (interval) clearInterval(interval);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [push]);

  const latest = history.length > 0 ? history[history.length - 1]! : null;

  return { status, history, latest, lastError };
}
