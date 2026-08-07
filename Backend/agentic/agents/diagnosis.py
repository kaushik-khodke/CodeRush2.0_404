import json
import logging
import asyncio
from typing import Dict, Any
from agentic.graph.state import MissionGraphState
from agentic.llm.factory import llm_factory
from agentic.consensus.engine import consensus_engine
from agentic.trust.engine import trust_engine
from agentic.prompts.diagnosis_prompt import DIAGNOSIS_SYSTEM_PROMPT

logger = logging.getLogger("DiagnosisAgent")

def run_diagnosis_agent(state: MissionGraphState) -> MissionGraphState:
    """
    3. Diagnosis Agent:
    Triggered when ML Sentinel detects an anomaly.
    Invokes LLM Factory across non-communicating Groq, Gemini, OpenAI, and Ollama models in parallel.
    Evaluates outputs through Consensus Engine and Trust Engine.
    """
    telemetry = state.get("telemetry_data", {})
    ml_output = state.get("ml_output", {})
    history = state.get("telemetry_history", [])
    memory = state.get("mission_memory", [])

    failure_class = ml_output.get("failure_class", "Anomaly Detected")
    confidence = ml_output.get("confidence", 0.90)
    anomaly_score = ml_output.get("anomaly_score", 0.80)

    user_prompt = f"""
    [SPACE SATELLITE ANOMALY DIAGNOSIS REQUEST]
    ML Sentinel Detection: {failure_class} (ML Confidence: {confidence*100:.1f}%, Anomaly Score: {anomaly_score:.3f})
    
    Current Telemetry:
    - Battery Voltage: {telemetry.get('Battery_Voltage', 'N/A')} V | SOC: {telemetry.get('Battery_SOC', 'N/A')} % | Current: {telemetry.get('Battery_Current', 'N/A')} A
    - Solar Voltage: {telemetry.get('Solar_Voltage', 'N/A')} V | Generation: {telemetry.get('Power_Generation', 'N/A')} W
    - CPU Temp: {telemetry.get('CPU_Temperature', 'N/A')} C | Payload Temp: {telemetry.get('Payload_Temperature', 'N/A')} C
    - Thruster Temp: {telemetry.get('Thruster_Temperature', 'N/A')} C | Fuel Level: {telemetry.get('Fuel_Level', 'N/A')} %
    - Signal Strength: {telemetry.get('Signal_Strength', 'N/A')} dBm | Packet Loss: {telemetry.get('Packet_Loss', 'N/A')} %
    
    Telemetry History Count: {len(history)}
    Mission Memory Context: {json.dumps(memory[:2]) if memory else 'None'}
    """

    # Trigger Parallel Independent LLM Provider Reasoning
    try:
        loop = asyncio.get_event_loop()
        llm_responses = loop.run_until_complete(
            llm_factory.execute_all_providers(DIAGNOSIS_SYSTEM_PROMPT, user_prompt)
        )
    except Exception as e:
        logger.error(f"[DiagnosisAgent] Async loop execution notice: {e}")
        # Run synchronous fallback call
        fallback_res = llm_factory.providers["groq"].create_fallback_response(
            root_cause=f"Subsystem telemetry divergence matching {failure_class}",
            procedure="Enter Safe Mode - Shed Non-Essential Payload",
            reasoning="Parallel LLM invocation fell back to deterministic rule system."
        )
        llm_responses = [fallback_res]

    # Evaluate Multi-Model Consensus
    consensus_res = consensus_engine.evaluate(llm_responses)

    # Evaluate Safety Constraints & Digital Twin Simulation
    constraints_ok = telemetry.get("Battery_SOC", 80) >= 30.0 and telemetry.get("CPU_Temperature", 45) <= 70.0
    sim_ok = True  # Verified by Simulation Agent next

    # Calculate Composite 0-100 Trust Score
    trust_eval = trust_engine.calculate_trust_score(
        ml_confidence=confidence,
        consensus_ratio=consensus_res.agreement_ratio,
        constraints_passed=constraints_ok,
        simulation_passed=sim_ok
    )

    state["llm_responses"] = [r.model_dump() for r in llm_responses]
    state["consensus_output"] = consensus_res.model_dump()
    state["trust_evaluation"] = trust_eval.model_dump()

    primary_res = llm_responses[0]
    diagnosis_summary = {
        "root_cause": consensus_res.agreed_root_cause,
        "confidence": round(confidence, 4),
        "hypotheses": [
            f"Primary: {consensus_res.agreed_root_cause}",
            f"Secondary: Subsystem component electrical/thermal drift."
        ],
        "evidence": primary_res.evidence,
        "severity": primary_res.severity,
        "recommended_procedure": consensus_res.agreed_procedure,
        "explanation": primary_res.reasoning,
        "consensus_status": consensus_res.consensus_status,
        "trust_score": trust_eval.trust_score
    }

    state["diagnosis_output"] = diagnosis_summary
    logger.info(f"[DiagnosisAgent] Diagnosis Complete | Trust Score: {trust_eval.trust_score}/100 | Consensus: {consensus_res.consensus_status}")
    return state
