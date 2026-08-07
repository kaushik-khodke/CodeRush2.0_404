from typing import List, Dict, Any
from sqlalchemy.future import select
from database.db import AsyncSessionLocal
from database.models import MissionMemory, AuditLog

class SupabaseMissionMemoryTool:
    """
    Supabase Long-Term Mission Memory & Audit Trail Tool.
    Stores and retrieves historical anomaly resolutions, operator decisions, and lessons learned.
    """
    async def get_historical_anomalies(self, failure_class: str, limit: int = 5) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as session:
            stmt = select(MissionMemory).where(MissionMemory.event_type == failure_class).order_by(MissionMemory.timestamp.desc()).limit(limit)
            result = await session.execute(stmt)
            memories = result.scalars().all()
            
            if not memories:
                # Return default domain memory baseline if database table is empty
                return [
                    {
                        "event_type": failure_class,
                        "key_outcomes": {
                            "resolution": "Applied Standard Emergency Load Shedding",
                            "operator_decision": "APPROVED",
                            "success": True,
                            "lessons_learned": "Quick load shedding prevents battery degradation."
                        },
                        "timestamp": "2026-01-15T10:00:00Z"
                    }
                ]
            
            return [
                {
                    "event_type": m.event_type,
                    "key_outcomes": m.key_outcomes,
                    "timestamp": m.timestamp.isoformat()
                }
                for m in memories
            ]

    async def log_memory(self, session_id: str, event_type: str, key_outcomes: Dict[str, Any]):
        async with AsyncSessionLocal() as session:
            memory = MissionMemory(
                session_id=session_id,
                event_type=event_type,
                key_outcomes=key_outcomes
            )
            session.add(memory)
            await session.commit()

memory_tool = SupabaseMissionMemoryTool()
