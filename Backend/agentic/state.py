from typing import TypedDict, List, Dict, Any, Optional

class MissionGraphState(TypedDict, total=False):
    # Core Telemetry & Context State
    telemetry_data: Dict[str, Any]
    telemetry_history: List[Dict[str, Any]]
    mission_phase: str
    mission_state: str
    mission_constraints: Dict[str, Any]
    mission_plan: Dict[str, Any]
    resources: Dict[str, Any]
    mission_memory: List[Dict[str, Any]]

    # Agent Outputs
    telemetry_monitor_output: Optional[Dict[str, Any]]
    ml_output: Optional[Dict[str, Any]]
    planner_output: Optional[Dict[str, Any]]
    diagnosis_output: Optional[Dict[str, Any]]
    archivist_output: Optional[Dict[str, Any]]
    simulation_output: Optional[Dict[str, Any]]
    continuation_output: Optional[Dict[str, Any]]
    flight_director_output: Optional[Dict[str, Any]]
    warden_output: Optional[Dict[str, Any]]

    # System Control State
    is_anomaly: bool
    approval_status: str
    active_sop: Optional[str]
    operator_decision: Optional[str]
    audit_trail: List[Dict[str, Any]]
