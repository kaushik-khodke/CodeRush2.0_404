# ADR-002: Multi-LLM Provider Abstraction & Consensus Engine

## Context
Relying on a single LLM API provider creates a single point of failure and increases vulnerability to AI hallucinations during critical spacecraft recovery operations.

## Decision
We engineered a multi-provider LLM Factory (`Backend/agentic/llm/`) supporting Groq (`llama-3.3-70b`), Google Gemini (`gemini-2.5-flash-lite`), OpenAI (`gpt-4o-mini`), and Ollama (`qwen2.5-coder:7b`). A consensus engine queries models in parallel and enforces voting rules:
- $\ge 75\%$ Agreement $\rightarrow$ HIGH Consensus.
- $\ge 50\%$ Agreement $\rightarrow$ MEDIUM Consensus.
- $< 50\%$ Agreement $\rightarrow$ Escalates to Flight Director.

## Consequences
- Zero dependency on a single cloud LLM API.
- Eliminates outlier model hallucinations through parallel voting.
