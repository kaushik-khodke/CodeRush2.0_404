from typing import List, Dict, Any
from pydantic import BaseModel

class CandidateProcedure(BaseModel):
    code: str
    title: str
    version: str
    relevance_score: float
    preconditions: List[str]
    postconditions: List[str]
    steps: List[str]
    safety_precautions: List[str]

class ArchivistOutput(BaseModel):
    candidate_procedures: List[CandidateProcedure]
    top_recommended_sop: str
    retrieval_metadata: Dict[str, Any]
