class StorageSubsystem:
    """
    Models solid-state recorder (SSR) data buffer accumulation and downlink drain.
    """
    def __init__(self, capacity_gb: float = 64.0):
        self.capacity_gb = capacity_gb
        self.used_gb = 8.7

    def update(self, data_rate_mbps: float, downlink_rate_mbps: float, delta_sec: float = 1.0) -> dict:
        collected_gb = (data_rate_mbps * 0.125 * delta_sec) / 1024.0
        downlinked_gb = (downlink_rate_mbps * 0.125 * delta_sec) / 1024.0
        self.used_gb = min(self.capacity_gb, max(0.0, self.used_gb + collected_gb - downlinked_gb))
        return {
            "Storage_Buffer_Used_GB": round(self.used_gb, 2),
            "Storage_Capacity_GB": self.capacity_gb
        }
