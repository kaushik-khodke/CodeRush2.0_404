import json
from langchain_groq import ChatGroq
from agentic.state import MissionGraphState
from agentic.schemas.continuation_schema import ContinuationOutput
from agentic.prompts.continuation_prompt import CONTINUATION_SYSTEM_PROMPT
from agentic.tracing import get_langfuse_callback
from config import settings

def run_continuation_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Mission Continuation Agent:
    Evaluates mission recoverability and generates optimized post-anomaly schedule & objectives.
    """
    telemetry = state.get("telemetry_data", {})
    sim_output = state.get("simulation_output", {})
    diag_output = state.get("diagnosis_output", {})

    failure_class = state.get("ml_output", {}).get("failure_class", "Battery Failure")
    severity = diag_output.get("severity", "CRITICAL")

    prompt_user_input = f"""
    [MISSION CONTINUATION REQUEST]
    Failure Class: {failure_class} (Severity: {severity})
    Digital Twin Simulation Forecast: {sim_output.get('expected_outcome', 'Load shedding required')}
    Success Probability: {sim_output.get('success_probability', 0.95)*100:.1f}%
    Battery SOC: {telemetry.get('Battery_SOC', 80):.1f}% | Fuel Level: {telemetry.get('Fuel_Level', 85):.1f}%
    
    Determine if mission is recoverable, alternative ground station passes, and resource optimization plan in exact JSON format matching CONTINUATION_SYSTEM_PROMPT.
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
                {"role": "system", "content": CONTINUATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_user_input}
            ], config=config)
            text = response.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

            parsed = json.loads(text)
            output = ContinuationOutput(**parsed)
        except Exception as e:
            print(f"[Continuation Agent LLM Warning] Groq fallback: {e}")
            output = _fallback_continuation(telemetry, failure_class)
    else:
        output = _fallback_continuation(telemetry, failure_class)

    state["continuation_output"] = output.model_dump()
    return state

def _fallback_continuation(telemetry: dict, failure_class: str) -> ContinuationOutput:
    soc = telemetry.get("Battery_SOC", 80)
    recoverable = soc > 20.0 and failure_class != "Critical Failure"

    return ContinuationOutput(
        is_recoverable=recoverable,
        new_mission_schedule=[
            {"task": "Execute Emergency Procedure", "time": "T+00:00", "priority": 1},
            {"task": "Telemetry Health Verification", "time": "T+00:15", "priority": 2},
            {"task": "Resume Earth Observation", "time": "T+01:00", "priority": 3}
        ],
        remaining_objectives=["Earth Mapping Observation", "Ground Telemetry Downlink"],
        resource_optimization_plan="Shed secondary instrument loads to accelerate battery charge recovery.",
        alternative_comm_windows=["Pass #1042 - Svalbard (14:32 UTC)", "Pass #1043 - Goldstone (16:15 UTC)"],
        safe_mode_required=not recoverable,
        recovery_notes=f"Mission recoverable ({'Yes' if recoverable else 'No'}). Safe Mode entry recommended if battery SOC fails to rebound."
    )
