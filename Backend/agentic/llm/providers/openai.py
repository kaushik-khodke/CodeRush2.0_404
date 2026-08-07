import os
import asyncio
import logging
import httpx
from agentic.llm.base_provider import BaseLLMProvider
from agentic.schemas.llm_response import StandardLLMResponse

logger = logging.getLogger("OpenAIProvider")

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model_name: str = "gpt-4o-mini", timeout: float = 12.0):
        super().__init__(name="openai", model_name=model_name, timeout=timeout)
        self.api_key = os.getenv("OPENAI_API_KEY", "")

    async def generate(self, system_prompt: str, user_prompt: str) -> StandardLLMResponse:
        if not self.api_key:
            logger.info("[OpenAIProvider] OPENAI_API_KEY not set. Returning provider fallback.")
            return self.create_fallback_response(
                root_cause="OpenAI Evaluated Subsystem Transient",
                procedure="Isolate Thruster Lines & Lock Attitude Control",
                reasoning="OPENAI_API_KEY not configured. Invoked rule fallback."
            )

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw_text = res_data["choices"][0]["message"]["content"]
                data = self.parse_json_response(raw_text)
                data["provider"] = "openai"
                return StandardLLMResponse(**data)
        except Exception as e:
            logger.error(f"[OpenAIProvider] Error: {e}")
            return self.create_fallback_response(
                root_cause="OpenAI Evaluated Telemetry Variance",
                procedure="Isolate Thruster Lines & Lock Attitude Control",
                reasoning=f"OpenAI API error: {e}"
            )
