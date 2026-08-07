class ComputerSubsystem:
    """
    Models flight computer CPU usage, RAM utilization, storage capacity, process health, and software version.
    """
    def __init__(self):
        self.cpu_usage = 45.0
        self.ram_usage = 50.0
        self.storage_usage = 40.0
        self.process_health = 1
        self.software_version = 2.1

    def update(self, thermal_hw_fault: float = 0.0) -> dict:
        self.cpu_usage = round(min(100.0, max(10.0, 45.0 + thermal_hw_fault * 25.0)), 2)
        return {
            "CPU_Usage": self.cpu_usage,
            "RAM_Usage": self.ram_usage,
            "Storage_Usage": self.storage_usage,
            "Process_Health": self.process_health,
            "Software_Version": self.software_version
        }
