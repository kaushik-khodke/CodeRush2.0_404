from agentic.state import MissionGraphState
from agentic.schemas.archivist_schema import ArchivistOutput, CandidateProcedure
from agentic.tools.vector_sop_retriever import sop_retriever_tool

def run_archivist_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Archivist Agent (RAG):
    Retrieves relevant Standard Operating Procedures (SOPs), manuals, and runbooks
    from the SOP vector knowledge base matching the diagnosed anomaly.
    """
    diag_output = state.get("diagnosis_output", {})
    ml_output = state.get("ml_output", {})

    failure_class = ml_output.get("failure_class", "Battery Failure")
    root_cause = diag_output.get("root_cause", failure_class)

    sops_raw = sop_retriever_tool.retrieve_sops(query=root_cause, failure_class=failure_class, top_k=3)

    candidates = [
        CandidateProcedure(
            code=sop["code"],
            title=sop["title"],
            version=sop["version"],
            relevance_score=sop.get("relevance_score", 0.9),
            preconditions=sop["preconditions"],
            postconditions=sop["postconditions"],
            steps=sop["steps"],
            safety_precautions=sop["safety_precautions"]
        )
        for sop in sops_raw
    ]

    top_sop = candidates[0].code if candidates else "SOP-BAT-01"

    output = ArchivistOutput(
        candidate_procedures=candidates,
        top_recommended_sop=top_sop,
        retrieval_metadata={"query": failure_class, "sop_count": len(candidates)}
    )

    state["archivist_output"] = output.model_dump()
    state["active_sop"] = top_sop
    return state
