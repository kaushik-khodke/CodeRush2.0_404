import time

class MissionClock:
    """
    Manages Mission Elapsed Time (MET) in seconds and ISO timestamps.
    """
    def __init__(self, initial_met: int = 128400, time_scale: float = 1.0):
        self.met = initial_met
        self.time_scale = time_scale
        self.start_wall_time = time.time()
        self.paused = False

    def tick(self, step_sec: float = 1.0) -> int:
        if not self.paused:
            self.met += int(step_sec * self.time_scale)
        return self.met

    def get_met(self) -> int:
        return self.met

    def get_timestamp_ms(self) -> int:
        return int(time.time() * 1000)

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False
