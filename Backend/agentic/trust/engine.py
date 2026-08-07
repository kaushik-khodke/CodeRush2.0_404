import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("TrustEngine")

class TrustEvaluation(BaseModel):
    """
    Composite Trust Score Evaluation Result (0 to 100).
    """
    trust_score: float = Field(ge=0.0, le=100.0, description="Overall Composite Trust Score (0-100)")
    status: str = Field(description="TRUSTED, CAUTION, or REJECTED")
    breakdown: Dict[str, float] = Field(description="Individual component metric scores")
    decision_gate: str = Field(description="QUEUE_FOR_HUMAN_APPROVAL or REJECTED_SAFETY_VIOLATION")

class TrustEngine:
    """
    NASA/ISRO-Grade Mission Trust Engine.
    Combines ML Confidence, LLM Consensus Agreement, Safety Constraints,
    Future Digital Twin Simulation, and Historical Mission Memory into a 0-100 Trust Score.
    """
    def calculate_trust_score(
        self,
        ml_confidence: float,            # 0.0 to 1.0
        consensus_ratio: float,          # 0.0 to 1.0
        constraints_passed: bool,        # True/False
        simulation_passed: bool,         # True/False
        memory_similarity: float = 0.90,  # 0.0 to 1.0
        evidence_quality: float = 0.95    # 0.0 to 1.0
    ) -> TrustEvaluation:
        
        # Hard Safety Override: Hard fail if safety constraints or simulation failed
        if not constraints_passed or not simulation_passed:
            logger.warning("[TrustEngine] Safety Constraint or Digital Twin Simulation FAILED. Trust score forced to 0.")
            return TrustEvaluation(
                trust_score=0.0,
                status="REJECTED",
                breakdown={
                    "ml_confidence": round(ml_confidence * 100, 1),
                    "consensus_agreement": round(consensus_ratio * 100, 1),
                    "constraints_passed": 0.0 if not constraints_passed else 100.0,
                    "simulation_passed": 0.0 if not simulation_passed else 100.0,
                    "memory_similarity": round(memory_similarity * 100, 1),
                    "evidence_quality": round(evidence_quality * 100, 1)
                },
                decision_gate="REJECTED_SAFETY_VIOLATION"
            )

        # Weighted calculation for passing scenarios
        w_ml = 0.25         # ML Model confidence weight (25%)
        w_consensus = 0.25  # LLM Multi-Model Consensus weight (25%)
        w_constraint = 0.20 # Constraint pass weight (20%)
        w_sim = 0.15        # Simulation pass weight (15%)
        w_mem = 0.10        # Mission Memory similarity weight (10%)
        w_ev = 0.05         # Evidence quality weight (5%)

        score_ml = ml_confidence * 100.0
        score_consensus = consensus_ratio * 100.0
        score_constraint = 100.0 if constraints_passed else 0.0
        score_sim = 100.0 if simulation_passed else 0.0
        score_mem = memory_similarity * 100.0
        score_ev = evidence_quality * 100.0

        raw_trust = (
            (w_ml * score_ml) +
            (w_consensus * score_consensus) +
            (w_constraint * score_constraint) +
            (w_sim * score_sim) +
            (w_mem * score_mem) +
            (w_ev * score_ev)
        )

        final_trust_score = round(min(100.0, max(0.0, raw_trust)), 1)

        if final_trust_score >= 80.0:
            status = "TRUSTED"
        elif final_trust_score >= 60.0:
            status = "CAUTION"
        else:
            status = "REJECTED"

        decision = "QUEUE_FOR_HUMAN_APPROVAL" if status in ["TRUSTED", "CAUTION"] else "REJECTED_LOW_TRUST"

        logger.info(f"[TrustEngine] Calculated Composite Trust Score: {final_trust_score}/100 -> Status: {status}")

        return TrustEvaluation(
            trust_score=final_trust_score,
            status=status,
            breakdown={
                "ml_confidence": round(score_ml, 1),
                "consensus_agreement": round(score_consensus, 1),
                "constraints_passed": score_constraint,
                "simulation_passed": score_sim,
                "memory_similarity": round(score_mem, 1),
                "evidence_quality": round(score_ev, 1)
            },
            decision_gate=decision
        )

# Singleton Trust Engine
trust_engine = TrustEngine()
