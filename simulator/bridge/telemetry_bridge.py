import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("TelemetryBridge")

class TelemetryBridge:
    """
    Isolated Telemetry Bridge between Simulator and FastAPI Backend / Supabase.
    No other simulator module communicates externally.
    """
    def __init__(self, backend_url: str = "http://localhost:8000/api/telemetry/frame"):
        self.backend_url = backend_url
        self.client = httpx.AsyncClient(timeout=4.0)

    async def send_frame(self, frame: Dict[str, Any]) -> bool:
        """
        Sends telemetry JSON frame to FastAPI Backend endpoint.
        """
        try:
            res = await self.client.post(self.backend_url, json=frame)
            if res.status_code == 200:
                return True
            else:
                logger.warning(f"[TelemetryBridge] Backend status {res.status_code}: {res.text[:100]}")
                return False
        except Exception as e:
            # Silence log if local server is starting up
            return False

    async def close(self):
        await self.client.aclose()
