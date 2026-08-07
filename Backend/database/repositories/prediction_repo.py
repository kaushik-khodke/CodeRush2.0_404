from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import Prediction

class PredictionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, prediction_dict: dict) -> Prediction:
        prediction = Prediction(**prediction_dict)
        self.session.add(prediction)
        await self.session.commit()
        await self.session.refresh(prediction)
        return prediction

    async def get_latest(self) -> Optional[Prediction]:
        stmt = select(Prediction).order_by(Prediction.timestamp.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_all(self, limit: int = 100) -> List[Prediction]:
        stmt = select(Prediction).order_by(Prediction.timestamp.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_telemetry_id(self, telemetry_id: str) -> Optional[Prediction]:
        stmt = select(Prediction).where(Prediction.telemetry_id == telemetry_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()
