from pydantic import BaseModel, Field
from typing import List, Optional

class StandardLLMResponse(BaseModel):
    """
    Standardized response schema returned by every LLM provider (Groq, Gemini, OpenAI, Ollama).
    Strictly enforced with Pydantic validation.
    """
    provider: str = Field(description="Name of the LLM provider (e.g., groq, gemini, openai, ollama)")
    root_cause: str = Field(description="Identified operational or hardware root cause of the anomaly")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Model diagnostic confidence score (0.0 to 1.0)")
    severity: str = Field(default="HIGH", description="Severity level: LOW, MEDIUM, HIGH, or CRITICAL")
    evidence: List[str] = Field(default_factory=list, description="Telemetry signals and constraints supporting the diagnosis")
    recommended_procedure: str = Field(description="Standard operating recovery procedure")
    risk: str = Field(default="MEDIUM", description="Risk level associated with procedure execution: LOW, MEDIUM, HIGH")
    reasoning: str = Field(description="Step-by-step engineering reasoning path")
    citations: List[str] = Field(default_factory=list, description="References to mission SOPs, runbooks, or engineering specs")
