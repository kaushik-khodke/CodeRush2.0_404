from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.repositories.approval_repo import ApprovalRepository
from database.repositories.audit_repo import AuditRepository
from schemas import ApprovalRequest, ApprovalResponse
from routers.websocket import ws_manager

router = APIRouter(prefix="/approval", tags=["Approval Queue"])

@router.post("", response_model=ApprovalResponse)
async def process_operator_approval(payload: ApprovalRequest, db: AsyncSession = Depends(get_db)):
    """
    Stores operator approval/rejection for automated procedure execution.
    Logs audit event and broadcasts real-time status update.
    """
    approval_repo = ApprovalRepository(db)
    audit_repo = AuditRepository(db)

    item = await approval_repo.get_by_id(payload.approval_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Approval queue item #{payload.approval_id} not found")

    updated_item = await approval_repo.update_status(
        approval_id=payload.approval_id,
        status=payload.status,
        approved_by=payload.approved_by,
        comments=payload.comments
    )

    await audit_repo.log(
        action=f"OPERATOR_APPROVAL_{payload.status}",
        entity_type="approval_queue",
        entity_id=payload.approval_id,
        user_id=payload.approved_by,
        payload={"status": payload.status, "comments": payload.comments}
    )

    await ws_manager.broadcast({
        "event": "APPROVAL_STATUS_CHANGED",
        "approval_id": payload.approval_id,
        "status": payload.status,
        "approved_by": payload.approved_by
    })

    return updated_item

@router.get("/queue", response_model=List[ApprovalResponse])
async def list_approval_queue(status_filter: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """
    Lists approval queue items, optionally filtered by status (PENDING, APPROVED, REJECTED).
    """
    approval_repo = ApprovalRepository(db)
    items = await approval_repo.get_all(status=status_filter)
    return items
