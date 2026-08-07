from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import Anomaly

class AnomalyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, anomaly_dict: dict) -> Anomaly:
        anomaly = Anomaly(**anomaly_dict)
        self.session.add(anomaly)
        await self.session.commit()
        await self.session.refresh(anomaly)
        return anomaly

    async def get_all(self, resolved: Optional[bool] = None, limit: int = 100) -> List[Anomaly]:
        stmt = select(Anomaly)
        if resolved is not None:
            stmt = stmt.where(Anomaly.resolved == resolved)
        stmt = stmt.order_by(Anomaly.timestamp.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def resolve(self, anomaly_id: str, resolved_by: Optional[str] = None) -> Optional[Anomaly]:
        stmt = select(Anomaly).where(Anomaly.id == anomaly_id)
        result = await self.session.execute(stmt)
        anomaly = result.scalars().first()
        if anomaly:
            anomaly.resolved = True
            anomaly.resolved_at = datetime.utcnow()
            anomaly.resolved_by = resolved_by
            await self.session.commit()
            await self.session.refresh(anomaly)
        return anomaly
