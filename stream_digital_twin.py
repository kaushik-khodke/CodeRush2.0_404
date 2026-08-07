"""
Live Basilisk Digital Twin Telemetry Streamer
Streams 1Hz telemetry from the Digital Twin simulator directly to FastAPI Backend & Supabase.
"""
import sys
import asyncio
from pathlib import Path

# Add root directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from simulator.telemetry.generator import TelemetryGenerator
from simulator.bridge.telemetry_bridge import TelemetryBridge
from simulator.faults.battery_failure import BatteryFailureFault
from simulator.faults.thermal_fault import ThermalFault

async def main():
    print("=" * 70)
    print("BASILISK DIGITAL TWIN SIMULATOR - LIVE TELEMETRY STREAMER")
    print("=" * 70)
    print("  Streaming 1Hz Telemetry -> http://localhost:8000/api/telemetry/frame")
    print("  Press Ctrl+C to terminate telemetry stream.\n")

    generator = TelemetryGenerator()
    bridge = TelemetryBridge(backend_url="http://localhost:8000/api/telemetry/frame")

    count = 0
    try:
        while True:
            frame = generator.generate_frame(step_sec=1.0)
            sent = await bridge.send_frame(frame)
            count += 1
            status = "SENT" if sent else "LOCAL"
            print(f"[{count:04d}][{status}][MET {frame['met']}] SOC: {frame['Battery_SOC']}% | Voltage: {frame['Battery_Voltage']}V | CPU Temp: {frame['CPU_Temperature']}°C | Phase: {frame['orbital_phase_deg']}°")
            await asyncio.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[STREAM] Stopping Digital Twin live stream.")
    finally:
        await bridge.close()

if __name__ == "__main__":
    asyncio.run(main())
