from typing import List, Dict, Any
from pydantic import BaseModel, Field

class ScheduledTask(BaseModel):
    task_name: str
    subsystem: str
    priority: int = Field(..., ge=1, le=5)
    start_time_offset_min: float
    duration_min: float
    resource_allocation: Dict[str, float]
    rationale: str

class MissionPlanOutput(BaseModel):
    schedule: List[ScheduledTask]
    task_ordering: List[str]
    resource_timeline: Dict[str, Any]
    constraint_satisfaction: bool
    summary: str
