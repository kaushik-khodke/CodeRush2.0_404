from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import AuditLog

class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log(self, action: str, entity_type: str, entity_id: str | None = None, user_id: str | None = None, payload: dict | None = None) -> AuditLog:
        log_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            payload=payload or {}
        )
        self.session.add(log_entry)
        await self.session.commit()
        await self.session.refresh(log_entry)
        return log_entry

    async def get_logs(self, limit: int = 100) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
