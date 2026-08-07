from typing import TypedDict, List, Dict, Any, Optional

class MissionGraphState(TypedDict, total=False):
    """
    Typed State Dict passed across the LangGraph Multi-Agent Workflow.
    """
    # Core Telemetry & Context State
    telemetry_data: Dict[str, Any]
    telemetry_history: List[Dict[str, Any]]
    mission_phase: str
    mission_state: str
    mission_constraints: Dict[str, Any]
    mission_plan: Dict[str, Any]
    resources: Dict[str, Any]
    mission_memory: List[Dict[str, Any]]

    # ML & Anomaly Sentinel State (Sole Source of Anomaly Truth)
    is_anomaly: bool
    ml_output: Optional[Dict[str, Any]]

    # Multi-LLM & Engine Outputs
    llm_responses: Optional[List[Dict[str, Any]]]
    consensus_output: Optional[Dict[str, Any]]
    trust_evaluation: Optional[Dict[str, Any]]

    # Specialized Agent Outputs
    telemetry_monitor_output: Optional[Dict[str, Any]]
    diagnosis_output: Optional[Dict[str, Any]]
    archivist_output: Optional[Dict[str, Any]]
    simulation_output: Optional[Dict[str, Any]]
    planner_output: Optional[Dict[str, Any]]
    flight_director_output: Optional[Dict[str, Any]]
    safety_output: Optional[Dict[str, Any]]
    warden_output: Optional[Dict[str, Any]]


    # Safety & Control State
    approval_queue: List[Dict[str, Any]]
    approval_status: str
    active_sop: Optional[str]
    operator_decision: Optional[str]
    audit_logs: List[Dict[str, Any]]
