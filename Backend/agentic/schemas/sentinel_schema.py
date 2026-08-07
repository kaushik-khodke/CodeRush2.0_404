from pydantic import BaseModel, Field

class MLSentinelOutput(BaseModel):
    is_anomaly: bool
    failure_class: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
