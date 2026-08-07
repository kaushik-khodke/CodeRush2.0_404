from typing import List, Dict, Any
from pydantic import BaseModel, Field

class TelemetryMonitorOutput(BaseModel):
    data_quality_score: float = Field(..., ge=0.0, le=1.0)
    missing_parameters: List[str]
    sensor_timeouts: List[str]
    trend_summary: Dict[str, str]
    subsystem_statuses: Dict[str, str]
    context_prepared: bool
