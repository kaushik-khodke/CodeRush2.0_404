from typing import List, Dict, Any
from pydantic import BaseModel

class ContinuationOutput(BaseModel):
    is_recoverable: bool
    new_mission_schedule: List[Dict[str, Any]]
    remaining_objectives: List[str]
    resource_optimization_plan: str
    alternative_comm_windows: List[str]
    safe_mode_required: bool
    recovery_notes: str
