from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import MissionPlan, MissionMemory

class MissionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_active_plan(self) -> Optional[MissionPlan]:
        stmt = select(MissionPlan).where(MissionPlan.status == "ACTIVE").limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def add_memory(self, memory_dict: dict) -> MissionMemory:
        memory = MissionMemory(**memory_dict)
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        return memory

    async def get_memories(self, session_id: Optional[str] = None, limit: int = 50) -> List[MissionMemory]:
        stmt = select(MissionMemory)
        if session_id:
            stmt = stmt.where(MissionMemory.session_id == session_id)
        stmt = stmt.order_by(MissionMemory.timestamp.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
