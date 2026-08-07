import abc
from typing import Dict, Any

class BaseFaultPlugin(abc.ABC):
    """
    Abstract Base Class for Fault Injection Plugins.
    Dynamically modifies telemetry dictionary outputs.
    """
    def __init__(self, name: str, subsystem: str, magnitude: float = 1.0):
        self.name = name
        self.subsystem = subsystem
        self.magnitude = magnitude
        self.active = False

    def activate(self, magnitude: float = None):
        self.active = True
        if magnitude is not None:
            self.magnitude = magnitude

    def deactivate(self):
        self.active = False

    @abc.abstractmethod
    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies fault modification to telemetry parameter dictionary.
        """
        pass
