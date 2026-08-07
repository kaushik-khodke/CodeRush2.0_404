from typing import List, Dict
from pydantic import BaseModel

class WardenOutput(BaseModel):
    is_approved_for_queue: bool
    constraint_checks: Dict[str, bool]
    rejection_reasons: List[str]
    queued_action: str
    safety_summary: str
