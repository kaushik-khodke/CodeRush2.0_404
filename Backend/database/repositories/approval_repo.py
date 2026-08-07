from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import ApprovalQueue

class ApprovalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, approval_dict: dict) -> ApprovalQueue:
        item = ApprovalQueue(**approval_dict)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_by_id(self, approval_id: str) -> Optional[ApprovalQueue]:
        stmt = select(ApprovalQueue).where(ApprovalQueue.id == approval_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update_status(self, approval_id: str, status: str, approved_by: Optional[str] = None, comments: Optional[str] = None) -> Optional[ApprovalQueue]:
        item = await self.get_by_id(approval_id)
        if item:
            item.status = status
            item.approved_by = approved_by
            item.comments = comments
            item.updated_at = datetime.utcnow()
            await self.session.commit()
            await self.session.refresh(item)
        return item

    async def get_all(self, status: Optional[str] = None, limit: int = 100) -> List[ApprovalQueue]:
        stmt = select(ApprovalQueue)
        if status:
            stmt = stmt.where(ApprovalQueue.status == status)
        stmt = stmt.order_by(ApprovalQueue.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
