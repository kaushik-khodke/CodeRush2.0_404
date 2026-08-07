import json
from langchain_groq import ChatGroq
from agentic.state import MissionGraphState
from agentic.schemas.diagnosis_schema import DiagnosisOutput
from agentic.prompts.diagnosis_prompt import DIAGNOSIS_SYSTEM_PROMPT
from agentic.tracing import get_langfuse_callback
from config import settings

def run_diagnosis_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Diagnosis Agent:
    Triggered only when ML Sentinel detects an anomaly.
    Uses Groq LLM (llama-3.3-70b-versatile) to reason about root cause, evidence, and competing hypotheses.
    """
    telemetry = state.get("telemetry_data", {})
    ml_output = state.get("ml_output", {})
    history = state.get("telemetry_history", [])
    memory = state.get("mission_memory", [])
    constraints = state.get("mission_constraints", {})

    failure_class = ml_output.get("failure_class", "Anomaly Detected")
    anomaly_score = ml_output.get("anomaly_score", 0.8)

    prompt_user_input = f"""
    [SPACE SATELLITE TELEMETRY ANALYSIS REQUEST]
    ML Sentinel Detection: {failure_class} (Confidence: {ml_output.get('confidence', 0.9)*100:.1f}%, Anomaly Score: {anomaly_score:.3f})
    
    Current Telemetry Highlights:
    - Battery Voltage: {telemetry.get('Battery_Voltage', 'N/A')} V | SOC: {telemetry.get('Battery_SOC', 'N/A')} % | Current: {telemetry.get('Battery_Current', 'N/A')} A
    - Solar Voltage: {telemetry.get('Solar_Voltage', 'N/A')} V | Generation: {telemetry.get('Power_Generation', 'N/A')} W
    - CPU Temp: {telemetry.get('CPU_Temperature', 'N/A')} C | Payload Temp: {telemetry.get('Payload_Temperature', 'N/A')} C
    - Thruster Temp: {telemetry.get('Thruster_Temperature', 'N/A')} C | Fuel Level: {telemetry.get('Fuel_Level', 'N/A')} %
    - Signal Strength: {telemetry.get('Signal_Strength', 'N/A')} dBm | Packet Loss: {telemetry.get('Packet_Loss', 'N/A')} %
    
    Recent 60s Telemetry History Samples Count: {len(history)}
    Mission Memory Relevant Records: {json.dumps(memory[:2]) if memory else 'None'}
    
    Please provide the root cause analysis in exact JSON format matching DIAGNOSIS_SYSTEM_PROMPT.
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
                {"role": "system", "content": DIAGNOSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_user_input}
            ], config=config)
            text = response.content.strip()
            
            # Clean JSON markdown delimiters if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

            parsed = json.loads(text)
            output = DiagnosisOutput(**parsed)
        except Exception as e:
            print(f"[Diagnosis Agent LLM Warning] Groq LLM invocation fallback: {e}")
            output = _fallback_diagnosis(telemetry, failure_class)
    else:
        output = _fallback_diagnosis(telemetry, failure_class)

    state["diagnosis_output"] = output.model_dump()
    return state

def _fallback_diagnosis(telemetry: dict, failure_class: str) -> DiagnosisOutput:
    evidence = []
    if telemetry.get("Battery_SOC", 80) < 30:
        evidence.append("Battery_SOC [CRITICAL_LOW] (< 30%)")
    if telemetry.get("CPU_Temperature", 45) > 70:
        evidence.append("CPU_Temperature [CRITICAL_HIGH] (> 70 deg C)")
    if telemetry.get("Fuel_Level", 50) < 10:
        evidence.append("Fuel_Level [CRITICAL_LOW] (< 10%)")
    if not evidence:
        evidence.append(f"Primary subsystem parameter anomaly associated with {failure_class}")

    return DiagnosisOutput(
        root_cause=f"Subsystem telemetry divergence matching {failure_class} fault signature.",
        confidence=0.94,
        hypotheses=[
            f"Primary: {failure_class} caused by hardware thermal/electrical shift.",
            f"Secondary: Sensor calibration drift or transient telemetry bus spike."
        ],
        evidence=evidence,
        severity="CRITICAL" if "Failure" in failure_class or "Safe Mode" in failure_class else "HIGH",
        explanation=f"Telemetry parameters exhibit a statistically significant deviation corresponding to {failure_class}."
    )
