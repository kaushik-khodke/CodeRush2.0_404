from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import TelemetryData

class TelemetryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, telemetry_dict: dict) -> TelemetryData:
        telemetry = TelemetryData(**telemetry_dict)
        self.session.add(telemetry)
        await self.session.commit()
        await self.session.refresh(telemetry)
        return telemetry

    async def get_latest(self) -> Optional[TelemetryData]:
        stmt = select(TelemetryData).order_by(TelemetryData.timestamp.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_history(self, limit: int = 100) -> List[TelemetryData]:
        stmt = select(TelemetryData).order_by(TelemetryData.timestamp.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, telemetry_id: str) -> Optional[TelemetryData]:
        stmt = select(TelemetryData).where(TelemetryData.id == telemetry_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()
