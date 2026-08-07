import asyncio
import logging
from typing import List, Dict, Any, Optional
from agentic.llm.base_provider import BaseLLMProvider
from agentic.llm.providers.groq import GroqProvider
from agentic.llm.providers.gemini import GeminiProvider
from agentic.llm.providers.openai import OpenAIProvider
from agentic.llm.providers.ollama import OllamaProvider
from agentic.schemas.llm_response import StandardLLMResponse

logger = logging.getLogger("LLMFactory")

class LLMFactory:
    """
    Production-Grade LLM Factory.
    Manages provider instantiation, multi-model parallel execution, priority failovers,
    and Pydantic validation across Groq, Gemini, OpenAI, and Ollama.
    """
    def __init__(self):
        self.providers: Dict[str, BaseLLMProvider] = {
            "groq": GroqProvider(),
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
            "ollama": OllamaProvider()
        }
        self.priority_order = ["groq", "gemini", "openai", "ollama"]

    async def execute_all_providers(
        self,
        system_prompt: str,
        user_prompt: str,
        target_providers: Optional[List[str]] = None
    ) -> List[StandardLLMResponse]:
        """
        Executes parallel, non-communicating reasoning across all requested LLM providers.
        Guarantees that models never communicate with each other.
        """
        selected = target_providers or self.priority_order
        tasks = []

        for p_name in selected:
            if p_name in self.providers:
                provider = self.providers[p_name]
                tasks.append(provider.generate(system_prompt, user_prompt))

        logger.info(f"[LLMFactory] Triggering parallel reasoning across providers: {selected}")
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        results: List[StandardLLMResponse] = []
        for i, res in enumerate(responses):
            p_name = selected[i]
            if isinstance(res, StandardLLMResponse):
                results.append(res)
            elif isinstance(res, Exception):
                logger.error(f"[LLMFactory] Provider '{p_name}' failed with exception: {res}")
                # Generate deterministic fallback for failed provider slot
                fallback = self.providers[p_name].create_fallback_response(
                    root_cause=f"System Exception on {p_name}",
                    procedure="Maintain Current Operating Mode",
                    reasoning=str(res)
                )
                results.append(fallback)

        return results

    async def invoke_with_fallback(
        self,
        system_prompt: str,
        user_prompt: str,
        priority: Optional[List[str]] = None
    ) -> StandardLLMResponse:
        """
        Executes single provider call following priority order until success.
        """
        order = priority or self.priority_order
        for p_name in order:
            if p_name in self.providers:
                try:
                    res = await self.providers[p_name].generate(system_prompt, user_prompt)
                    if res and res.confidence > 0.0:
                        return res
                except Exception as e:
                    logger.warning(f"[LLMFactory] Failover: Provider '{p_name}' failed ({e}). Trying next provider...")

        # Ultimate fallback if all providers fail
        return self.providers["groq"].create_fallback_response(
            root_cause="Multi-Provider System Degradation",
            procedure="Enter Safe Mode - Shed Non-Essential Payload",
            reasoning="All configured LLM providers were unreachable or timed out."
        )

# Global LLM Factory Singleton
llm_factory = LLMFactory()
