import abc
import time
import json
import logging
from typing import Dict, Any, Optional
from agentic.schemas.llm_response import StandardLLMResponse
from agentic.tracing import log_agent_trace

logger = logging.getLogger("LLMProvider")
logging.basicConfig(level=logging.INFO)

class BaseLLMProvider(abc.ABC):
    """
    Abstract Base Class for all LLM Providers (Groq, Gemini, OpenAI, Ollama).
    Guarantees unified interface, Pydantic validation, timing metrics, and error handling.
    """
    def __init__(self, name: str, model_name: str, timeout: float = 10.0):
        self.name = name
        self.model_name = model_name
        self.timeout = timeout

    @abc.abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> StandardLLMResponse:
        """
        Asynchronously generates reasoning output conforming to StandardLLMResponse.
        Must be implemented by subclasses.
        """
        pass

    def log_trace(self, prompt: str, result: StandardLLMResponse, metadata: Optional[dict] = None):
        """
        Logs generation trace directly to Langfuse Cloud for full observability.
        """
        try:
            log_agent_trace(
                trace_name=f"SMOA Mission Anomaly Analysis ({self.name.upper()})",
                agent_name=f"{self.name.capitalize()} Agent ({self.model_name})",
                prompt=prompt,
                output=result.model_dump(),
                metadata=metadata or {"provider": self.name, "model": self.model_name},
                model_name=self.model_name
            )
        except Exception as e:
            logger.warning(f"[{self.name}] Langfuse trace log notice: {e}")

    def parse_json_response(self, text: str) -> Dict[str, Any]:

        """
        Extracts and parses clean JSON from LLM text output.
        Handles markdown delimiters ```json ... ```.
        """
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"[{self.name}] Failed to parse JSON response: {e}. Raw text: {text[:200]}")
            raise ValueError(f"Invalid JSON returned by provider {self.name}: {e}")

    def create_fallback_response(self, root_cause: str, procedure: str, reasoning: str) -> StandardLLMResponse:
        """
        Generates a deterministic fallback response when provider fails or is unconfigured.
        """
        return StandardLLMResponse(
            provider=self.name,
            root_cause=root_cause,
            confidence=0.85,
            severity="HIGH",
            evidence=["System fallback triggered due to provider unavailability"],
            recommended_procedure=procedure,
            risk="MEDIUM",
            reasoning=reasoning,
            citations=["SMOA-SOP-EMERGENCY-01"]
        )
