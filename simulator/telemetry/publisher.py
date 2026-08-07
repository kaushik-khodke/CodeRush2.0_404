import asyncio
import logging
from typing import Callable, Optional, Dict, Any
from simulator.telemetry.generator import TelemetryGenerator

logger = logging.getLogger("TelemetryPublisher")

class TelemetryPublisher:
    """
    Handles async 1Hz telemetry publishing loop to callbacks or HTTP/WebSocket bridges.
    """
    def __init__(self, generator: TelemetryGenerator, interval_sec: float = 1.0):
        self.generator = generator
        self.interval_sec = interval_sec
        self.running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self, callback: Callable[[Dict[str, Any]], None]):
        self.running = True
        logger.info(f"[TelemetryPublisher] Starting 1Hz telemetry publisher loop (Interval: {self.interval_sec}s)...")
        while self.running:
            try:
                frame = self.generator.generate_frame(step_sec=self.interval_sec)
                if asyncio.iscoroutinefunction(callback):
                    await callback(frame)
                else:
                    callback(frame)
            except Exception as e:
                logger.error(f"[TelemetryPublisher] Publishing error: {e}")
            await asyncio.sleep(self.interval_sec)

    def stop(self):
        self.running = False
        logger.info("[TelemetryPublisher] Telemetry publisher stopped.")
