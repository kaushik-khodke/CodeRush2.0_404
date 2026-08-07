from typing import List
from pydantic import BaseModel, Field

class DiagnosisOutput(BaseModel):
    root_cause: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    hypotheses: List[str]
    evidence: List[str]
    severity: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    explanation: str
