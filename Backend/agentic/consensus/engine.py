import logging
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from agentic.schemas.llm_response import StandardLLMResponse

logger = logging.getLogger("ConsensusEngine")

class ConsensusResult(BaseModel):
    """
    Structured output of Multi-Model Consensus Evaluation.
    """
    consensus_status: str = Field(description="HIGH, MEDIUM, or REQUIRES HUMAN REVIEW")
    agreed_root_cause: str = Field(description="Consensus identified root cause or review note")
    agreed_procedure: str = Field(description="Consensus agreed recovery procedure")
    agreed_risk: str = Field(description="Agreed operational risk level")
    agreement_ratio: float = Field(description="Ratio of models in agreement (0.0 to 1.0)")
    participating_providers: List[str] = Field(description="List of provider names evaluated")
    individual_responses: List[Dict[str, Any]] = Field(description="Raw responses per provider")
    consensus_explanation: str = Field(description="Detailed voting explanation")

class ConsensusEngine:
    """
    Consensus Engine for Space Mission Control.
    Evaluates independent responses from Groq, Gemini, OpenAI, and Ollama.
    Enforces Strict Voting:
      - 3/4 (>= 75%) agreement -> HIGH Confidence
      - 2/4 (>= 50%) agreement -> MEDIUM Confidence
      - Below 50% -> REQUIRES HUMAN REVIEW (No guessing allowed)
    """
    def evaluate(self, responses: List[StandardLLMResponse]) -> ConsensusResult:
        if not responses:
            return ConsensusResult(
                consensus_status="REQUIRES HUMAN REVIEW",
                agreed_root_cause="No provider responses available",
                agreed_procedure="Standby for Ground Control Manual Override",
                agreed_risk="HIGH",
                agreement_ratio=0.0,
                participating_providers=[],
                individual_responses=[],
                consensus_explanation="Zero LLM provider responses were submitted for voting."
            )

        total_models = len(responses)
        providers = [r.provider for r in responses]

        # Group responses by normalized recommended procedure key
        procedure_groups: Dict[str, List[StandardLLMResponse]] = {}
        for r in responses:
            key = r.recommended_procedure.strip().lower()
            if key not in procedure_groups:
                procedure_groups[key] = []
            procedure_groups[key].append(r)

        # Find largest agreement cluster
        top_key = max(procedure_groups, key=lambda k: len(procedure_groups[k]))
        top_cluster = procedure_groups[top_key]
        agree_count = len(top_cluster)
        agreement_ratio = agree_count / float(total_models)

        primary_model_res = top_cluster[0]

        if agreement_ratio >= 0.75 or agree_count >= 3:
            status = "HIGH"
            explanation = f"High Consensus: {agree_count}/{total_models} models ({agreement_ratio*100:.0f}%) agreed on procedure '{primary_model_res.recommended_procedure}'."
        elif agreement_ratio >= 0.50 or agree_count >= 2:
            status = "MEDIUM"
            explanation = f"Medium Consensus: {agree_count}/{total_models} models ({agreement_ratio*100:.0f}%) agreed on procedure '{primary_model_res.recommended_procedure}'."
        else:
            status = "REQUIRES HUMAN REVIEW"
            explanation = f"No Consensus Achieved: Top agreement was only {agree_count}/{total_models} models. Escalating directly to Ground Control Operator."

        agreed_cause = primary_model_res.root_cause if status != "REQUIRES HUMAN REVIEW" else "DISCREPANCY: Model diagnostic divergence"
        agreed_proc = primary_model_res.recommended_procedure if status != "REQUIRES HUMAN REVIEW" else "Standby for Ground Control Override"
        agreed_risk = primary_model_res.risk if status != "REQUIRES HUMAN REVIEW" else "HIGH"

        result = ConsensusResult(
            consensus_status=status,
            agreed_root_cause=agreed_cause,
            agreed_procedure=agreed_proc,
            agreed_risk=agreed_risk,
            agreement_ratio=round(agreement_ratio, 2),
            participating_providers=providers,
            individual_responses=[r.model_dump() for r in responses],
            consensus_explanation=explanation
        )

        logger.info(f"[ConsensusEngine] Evaluated {total_models} models -> Status: {status} | Ratio: {agreement_ratio:.2f}")
        return result

# Singleton Consensus Engine
consensus_engine = ConsensusEngine()
