import { useCallback, useEffect, useState } from "react";
import type { AnomalyEvent, FaultInjection, LinkStatus, PendingCommand, TelemetryFrame } from "./types";

export const TELEMETRY_BUFFER = 300;
export const WINDOW_SECONDS = 60;

/**
 * Connects to the backend WebSocket stream (/ws/telemetry) to receive live spacecraft telemetry.
 * Restores telemetry history from backend on page reload so the console never resets to empty on browser reload.
 */
export function useTelemetry(
  _faults?: FaultInjection[],
  onAnomalyEvent?: (evt: AnomalyEvent) => void,
  onPendingCommand?: (cmd: PendingCommand) => void
) {
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [history, setHistory] = useState<TelemetryFrame[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const push = useCallback((frame: TelemetryFrame) => {
    setHistory((prev) => {
      const next = prev.length >= TELEMETRY_BUFFER ? prev.slice(prev.length - TELEMETRY_BUFFER + 1) : prev.slice();
      next.push(frame);
      return next;
    });
  }, []);

  // Restore history on load
  useEffect(() => {
    fetch("/api/seeding/history")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch history");
      })
      .then((data) => {
        if (data && Array.isArray(data.history) && data.history.length > 0) {
          setHistory(data.history);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let cancelled = false;

    const connectWebSocket = () => {
      if (cancelled) return;
      try {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        socket = new WebSocket(`${proto}//${host}/ws/telemetry`);

        socket.onopen = () => {
          setLastError(null);
          setStatus("live");
        };

        socket.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data as string);
            if (parsed.type === "TELEMETRY_FRAME" && parsed.frame) {
              push(parsed.frame as TelemetryFrame);
            } else if (parsed.type === "ANOMALY_EVENT") {
              if (parsed.event && onAnomalyEvent) {
                onAnomalyEvent(parsed.event as AnomalyEvent);
              }
              if (parsed.command && onPendingCommand) {
                onPendingCommand(parsed.command as PendingCommand);
              }
            } else if (parsed.met && parsed.power) {
              push(parsed as TelemetryFrame);
            }
          } catch {
            setLastError("Malformed telemetry frame discarded.");
          }
        };

        socket.onerror = () => {
          setStatus("degraded");
          setLastError("Telemetry backend socket error. Ensure backend is running and seeding is started on Port 5174.");
        };

        socket.onclose = () => {
          if (!cancelled) {
            setStatus("degraded");
            setLastError("Awaiting stream. Start data seeding on Seeding Controller Page (http://localhost:5174).");
            setTimeout(connectWebSocket, 3000);
          }
        };
      } catch (err) {
        setStatus("degraded");
        setLastError("Unable to connect to telemetry backend.");
      }
    };

    connectWebSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [push, onAnomalyEvent, onPendingCommand]);

  const latest = history.length > 0 ? history[history.length - 1]! : null;

  return { status, history, latest, lastError };
}
