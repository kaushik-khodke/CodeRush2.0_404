import math

class CommunicationSubsystem:
    """
    Models Friis RF path loss, signal strength dBm, packet loss, latency, and contact pass windows.
    """
    def __init__(self):
        self.signal_strength = -92.4
        self.downlink_rate = 10.0
        self.uplink_rate = 1.0
        self.packet_loss = 0.4
        self.latency = 420.0
        self.contact_window = 1

    def update(self, met: int, orbit_angle: float, comms_loss_fault: float = 0.0) -> dict:
        wobble = lambda period, phase=0.0: math.sin((met / period) * math.pi * 2 + phase)

        # Contact window active during specific orbital phase pass angles
        self.contact_window = 1 if (15.0 <= orbit_angle <= 75.0 or 190.0 <= orbit_angle <= 240.0) else 0

        self.signal_strength = round(-92.4 + wobble(73.0) * 3.1 - comms_loss_fault * 8.0, 2)
        self.packet_loss = round(max(0.0, 0.4 + wobble(41.0) * 0.3 + comms_loss_fault * 24.0), 2)
        self.latency = round(420.0 + wobble(311.0) * 50.0 + comms_loss_fault * 1200.0, 2)

        return {
            "Signal_Strength": self.signal_strength,
            "Downlink_Rate": self.downlink_rate if self.contact_window else 0.0,
            "Uplink_Rate": self.uplink_rate if self.contact_window else 0.0,
            "Packet_Loss": self.packet_loss,
            "Latency": self.latency,
            "Communication_Window": self.contact_window
        }
