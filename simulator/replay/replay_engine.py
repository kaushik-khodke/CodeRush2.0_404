import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ReplayEngine")

class ReplayEngine:
    """
    Time-Series Telemetry Replay Engine.
    Records history snapshots and supports Play, Pause, Fast Forward, and Seek.
    """
    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self.cursor: int = 0
        self.is_playing: bool = False
        self.playback_speed: float = 1.0

    def record_frame(self, frame: Dict[str, Any]):
        """
        Stores snapshot in historical telemetry buffer.
        """
        snapshot = {
            "index": len(self.history),
            "recorded_at": time.time(),
            "telemetry": frame
        }
        self.history.append(snapshot)

    def play(self, speed: float = 1.0):
        self.is_playing = True
        self.playback_speed = speed
        logger.info(f"[ReplayEngine] Playback started at {speed}x speed.")

    def pause(self):
        self.is_playing = False
        logger.info("[ReplayEngine] Playback paused.")

    def seek(self, index: int) -> Optional[Dict[str, Any]]:
        if 0 <= index < len(self.history):
            self.cursor = index
            logger.info(f"[ReplayEngine] Seeked to index {index}/{len(self.history)}.")
            return self.history[self.cursor]["telemetry"]
        return None

    def step_next(self) -> Optional[Dict[str, Any]]:
        if self.cursor < len(self.history):
            frame = self.history[self.cursor]["telemetry"]
            self.cursor += 1
            return frame
        return None

    def get_history(self) -> List[Dict[str, Any]]:

        return [h["telemetry"] for h in self.history]
