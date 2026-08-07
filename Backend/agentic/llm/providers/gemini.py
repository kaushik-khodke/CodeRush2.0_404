import os
import asyncio
import logging
import httpx
from agentic.llm.base_provider import BaseLLMProvider
from agentic.schemas.llm_response import StandardLLMResponse
from config import settings

logger = logging.getLogger("GeminiProvider")

class GeminiProvider(BaseLLMProvider):
    def __init__(self, model_name: str = None, timeout: float = 12.0):
        model = model_name or getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
        super().__init__(name="gemini", model_name=model, timeout=timeout)
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")


    async def generate(self, system_prompt: str, user_prompt: str) -> StandardLLMResponse:
        if not self.api_key:
            logger.info("[GeminiProvider] GEMINI_API_KEY not set. Returning provider fallback.")
            return self.create_fallback_response(
                root_cause="Thermal/Electrical Divergence (Gemini Rule Engine)",
                procedure="Engage Auxiliary Thermal Loops & Shed Non-Essential Payload",
                reasoning="GEMINI_API_KEY not configured. Invoked rule fallback."
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\nUSER REQUEST:\n{user_prompt}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                data = self.parse_json_response(raw_text)
                data["provider"] = "gemini"
                return StandardLLMResponse(**data)
        except Exception as e:
            logger.error(f"[GeminiProvider] Error: {e}")
            return self.create_fallback_response(
                root_cause="Gemini Evaluated Telemetry Anomaly",
                procedure="Engage Auxiliary Thermal Loops",
                reasoning=f"Gemini API invocation error: {e}"
            )
