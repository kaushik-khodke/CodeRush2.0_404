from typing import List
from pydantic import BaseModel, Field

class FlightDirectorOutput(BaseModel):
    final_recommendation: str
    summary: str
    reason: str
    risk_level: str = Field(..., description="Low, Medium, High, Critical")
    evidence: List[str]
    expected_impact: str
    recommended_procedure: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    human_explanation: str
