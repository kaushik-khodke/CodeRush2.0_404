import os
import asyncio
import logging
import httpx
from agentic.llm.base_provider import BaseLLMProvider
from agentic.schemas.llm_response import StandardLLMResponse

from config import settings

logger = logging.getLogger("OllamaProvider")

class OllamaProvider(BaseLLMProvider):
    def __init__(self, model_name: str = None, timeout: float = 12.0):
        model = model_name or getattr(settings, "OLLAMA_MODEL", "qwen2.5-coder:7b")
        super().__init__(name="ollama", model_name=model, timeout=timeout)
        self.base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


    async def generate(self, system_prompt: str, user_prompt: str) -> StandardLLMResponse:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": f"{system_prompt}\n\nUSER REQUEST:\n{user_prompt}",
            "stream": False,
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw_text = res_data.get("response", "")
                data = self.parse_json_response(raw_text)
                data["provider"] = "ollama"
                res_obj = StandardLLMResponse(**data)
                self.log_trace(user_prompt, res_obj)
                return res_obj

        except Exception as e:
            logger.info(f"[OllamaProvider] Local server at {self.base_url} unavailable or timing out: {e}")
            return self.create_fallback_response(
                root_cause="Local Ollama Telemetry Assessment",
                procedure="Execute Nominal Diagnostic & Verification Protocol",
                reasoning=f"Local Ollama server notice: {e}"
            )
