import asyncio
import logging
from agentic.llm.base_provider import BaseLLMProvider
from agentic.schemas.llm_response import StandardLLMResponse
from config import settings

logger = logging.getLogger("GroqProvider")

class GroqProvider(BaseLLMProvider):
    def __init__(self, model_name: str = "llama-3.3-70b-versatile", timeout: float = 12.0):
        super().__init__(name="groq", model_name=model_name, timeout=timeout)
        self.api_key = settings.GROQ_API_KEY

    async def generate(self, system_prompt: str, user_prompt: str) -> StandardLLMResponse:
        if not self.api_key or "gsk_" not in self.api_key:
            logger.warning("[GroqProvider] API key missing or placeholder. Using robust fallback.")
            return self.create_fallback_response(
                root_cause="Spacecraft Subsystem Telemetry Variance",
                procedure="Execute Nominal Diagnostic & Verification Protocol",
                reasoning="Groq API key not configured. Fallback invoked."
            )

        try:
            from langchain_groq import ChatGroq
            
            def _call_groq():
                llm = ChatGroq(
                    model_name=self.model_name,
                    groq_api_key=self.api_key,
                    temperature=0.1
                )
                res = llm.invoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                return res.content

            # Run synchronous invoke in async executor with timeout
            loop = asyncio.get_event_loop()
            raw_text = await asyncio.wait_for(
                loop.run_in_executor(None, _call_groq),
                timeout=self.timeout
            )

            data = self.parse_json_response(raw_text)
            data["provider"] = "groq"
            res_obj = StandardLLMResponse(**data)
            self.log_trace(user_prompt, res_obj)
            return res_obj


        except Exception as e:
            logger.error(f"[GroqProvider] Invocation error: {e}")
            return self.create_fallback_response(
                root_cause="Telemetry Anomaly - Groq Fallback Evaluation",
                procedure="Re-orient Arrays & Initiate Power Isolation",
                reasoning=f"Groq API call encountered exception: {e}"
            )
