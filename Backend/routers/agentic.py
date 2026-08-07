from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.repositories.telemetry_repo import TelemetryRepository
from database.repositories.approval_repo import ApprovalRepository
from schemas import TelemetryInput
from agentic.graph import mission_graph
from agentic.tools.vector_sop_retriever import sop_retriever_tool
from agentic.tools.supabase_memory_tool import memory_tool

router = APIRouter(prefix="/agentic", tags=["Agentic AI Layer"])

@router.post("/evaluate")
async def evaluate_agentic_workflow(payload: Optional[TelemetryInput] = None, db: AsyncSession = Depends(get_db)):
    """
    Executes the full LangGraph Agentic AI workflow across:
    Telemetry Monitor -> ML Sentinel -> Planner -> Diagnosis -> Archivist (RAG) -> 
    Digital Twin Simulator -> Mission Continuation -> Flight Director -> Warden Safety Gate.
    """
    telemetry_repo = TelemetryRepository(db)
    approval_repo = ApprovalRepository(db)

    if payload:
        telemetry_dict = payload.model_dump()
        telemetry_record = await telemetry_repo.create(telemetry_dict)
    else:
        telemetry_record = await telemetry_repo.get_latest()
        if not telemetry_record:
            raise HTTPException(status_code=404, detail="No telemetry available to run agentic evaluation")
        
        from services.prediction_service import ml_service
        telemetry_dict = {
            col: getattr(telemetry_record, col)
            for col in ml_service.feature_cols
        }

    # Prepare initial LangGraph state
    initial_state = {
        "telemetry_data": telemetry_dict,
        "telemetry_history": [telemetry_dict],
        "mission_phase": "MAPPING_OBSERVATION",
        "mission_state": "ACTIVE",
        "mission_constraints": {
            "Battery_SOC_Min": 30.0,
            "CPU_Temp_Max": 70.0,
            "Fuel_Level_Min": 10.0
        },
        "mission_memory": [],
        "audit_trail": []
    }

    from agentic.tracing import get_langfuse_callback
    handler = get_langfuse_callback()
    graph_config = {"callbacks": [handler]} if handler else {}

    # Execute LangGraph workflow
    final_state = mission_graph.invoke(initial_state, config=graph_config)

    # If Warden approved for queue, place into Approval Queue table automatically
    warden_out = final_state.get("warden_output", {})
    fd_out = final_state.get("flight_director_output", {})
    if warden_out.get("is_approved_for_queue", False):
        try:
            await approval_repo.create({
                "telemetry_id": telemetry_record.id,
                "recommended_action": fd_out.get("recommended_procedure", "SOP-BAT-01"),
                "status": "PENDING",
                "comments": fd_out.get("human_explanation", "Queued by Warden Safety Gate")
            })
        except Exception as e:
            print(f"[Agentic Router Warning] Approval queue logging notice: {e}")

    return {
        "is_anomaly": final_state.get("is_anomaly", False),
        "approval_status": final_state.get("approval_status", "NOMINAL"),
        "telemetry_monitor": final_state.get("telemetry_monitor_output"),
        "ml_sentinel": final_state.get("ml_output"),
        "planner": final_state.get("planner_output"),
        "diagnosis": final_state.get("diagnosis_output"),
        "archivist_rag": final_state.get("archivist_output"),
        "digital_twin_simulation": final_state.get("simulation_output"),
        "mission_continuation": final_state.get("continuation_output"),
        "flight_director_recommendation": final_state.get("flight_director_output"),
        "warden_safety_gate": final_state.get("warden_output")
    }

@router.get("/sops")
async def get_sop_runbooks(query: str = "Battery Failure", failure_class: str = "Battery Failure"):
    """
    Queries the Archivist RAG Vector Knowledge Base for Spacecraft SOPs.
    """
    return sop_retriever_tool.retrieve_sops(query=query, failure_class=failure_class)

@router.get("/memory")
async def get_mission_memory(failure_class: str = "Battery Failure"):
    """
    Queries Supabase long-term mission memory for historical anomaly outcomes.
    """
    return await memory_tool.get_historical_anomalies(failure_class=failure_class)
