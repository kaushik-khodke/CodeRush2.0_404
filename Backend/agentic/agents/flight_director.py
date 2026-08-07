import json
from langchain_groq import ChatGroq
from agentic.state import MissionGraphState
from agentic.schemas.flight_director_schema import FlightDirectorOutput
from agentic.prompts.flight_director_prompt import FLIGHT_DIRECTOR_SYSTEM_PROMPT
from agentic.tracing import get_langfuse_callback
from config import settings

def run_flight_director_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Flight Director Agent:
    Synthesizes outputs from Diagnosis, Archivist, Simulator, and Continuation agents
    to generate the final authoritative operational recommendation card.
    """
    telemetry = state.get("telemetry_data", {})
    diag = state.get("diagnosis_output", {})
    archivist = state.get("archivist_output", {})
    sim = state.get("simulation_output", {})
    continuation = state.get("continuation_output", {})

    failure_class = state.get("ml_output", {}).get("failure_class", "Battery Failure")
    top_sop = archivist.get("top_recommended_sop", "SOP-BAT-01")

    prompt_user_input = f"""
    [FLIGHT DIRECTOR RECOMMENDATION SYNTHESIS]
    Failure Mode: {failure_class}
    Root Cause: {diag.get('root_cause', 'Subsystem anomaly')}
    Diagnosed Severity: {diag.get('severity', 'CRITICAL')}
    
    Candidate SOP: {top_sop}
    Digital Twin Simulation Forecast: {sim.get('expected_outcome', 'Load shedding expected')}
    Simulated Success Probability: {sim.get('success_probability', 0.95)*100:.1f}%
    
    Continuation Plan: Recoverable={continuation.get('is_recoverable', True)}, SafeMode={continuation.get('safe_mode_required', False)}
    
    Generate the final executive recommendation card in exact JSON format matching FLIGHT_DIRECTOR_SYSTEM_PROMPT.
    """

    api_key = settings.GROQ_API_KEY
    if api_key and "gsk_" in api_key:
        try:
            llm = ChatGroq(
                model_name="llama-3.3-70b-versatile",
                groq_api_key=api_key,
                temperature=0.1
            )
            handler = get_langfuse_callback()
            config = {"callbacks": [handler]} if handler else {}

            response = llm.invoke([
                {"role": "system", "content": FLIGHT_DIRECTOR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_user_input}
            ], config=config)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

            parsed = json.loads(text)
            output = FlightDirectorOutput(**parsed)
        except Exception as e:
            print(f"[Flight Director Agent LLM Warning] Groq fallback: {e}")
            output = _fallback_flight_director(diag, sim, top_sop, failure_class)
    else:
        output = _fallback_flight_director(diag, sim, top_sop, failure_class)

    state["flight_director_output"] = output.model_dump()
    return state

def _fallback_flight_director(diag: dict, sim: dict, top_sop: str, failure_class: str) -> FlightDirectorOutput:
    return FlightDirectorOutput(
        final_recommendation=f"Execute {top_sop} to resolve {failure_class}.",
        summary=f"Spacecraft telemetry indicates {failure_class}. Digital Twin confirms {sim.get('expected_outcome', 'recovery')}.",
        reason=f"Procedure {top_sop} offers a {sim.get('success_probability', 0.95)*100:.1f}% success probability with minimal mission disruption.",
        risk_level=diag.get("severity", "CRITICAL"),
        evidence=diag.get("evidence", [f"Anomaly in {failure_class} telemetry"]),
        expected_impact=f"Battery SOC impact: {sim.get('battery_impact_percent', 12.5):+.1f}%, Temp trend: {sim.get('temperature_trend_deg_c', -8.0):.1f}C.",
        recommended_procedure=top_sop,
        confidence=0.96,
        human_explanation=f"Flight Director recommends executing {top_sop}. Action requires operator authorization before simulator dispatch."
    )
