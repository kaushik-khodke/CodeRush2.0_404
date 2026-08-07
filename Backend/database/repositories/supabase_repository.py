import logging
from typing import Dict, Any, List, Optional
from database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class SupabaseRepository:
    """
    Direct asynchronous/synchronous integration repository with Supabase.
    Persists telemetry, predictions, anomalies, approvals, activity schedules,
    and audit logs directly to Supabase tables.
    """
    
    @staticmethod
    def is_available() -> bool:
        client = get_supabase_client()
        return client is not None

    @classmethod
    def insert_telemetry(cls, telemetry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            # Format payload
            data = {k: v for k, v in telemetry_data.items() if v is not None}
            res = client.table("telemetry_data").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert telemetry into Supabase: {e}")
            return None

    @classmethod
    def insert_prediction(cls, prediction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {k: v for k, v in prediction_data.items() if v is not None}
            res = client.table("predictions").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert prediction into Supabase: {e}")
            return None

    @classmethod
    def get_latest_telemetry_id(cls) -> Optional[str]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            res = client.table("telemetry_data").select("id").order("created_at", desc=True).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["id"]
            return None
        except Exception:
            return None

    @classmethod
    def insert_anomaly(cls, anomaly_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {k: v for k, v in anomaly_data.items() if v is not None}
            if "telemetry_id" not in data or not data["telemetry_id"]:
                latest_id = cls.get_latest_telemetry_id()
                if latest_id:
                    data["telemetry_id"] = latest_id
            
            # Map severity enum safely
            if "severity" in data:
                sev = str(data["severity"]).upper()
                if sev == "WARNING":
                    data["severity"] = "HIGH"
                elif sev not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                    data["severity"] = "MEDIUM"
                else:
                    data["severity"] = sev

            res = client.table("anomalies").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert anomaly into Supabase: {e}")
            return None

    @classmethod
    def insert_approval_item(cls, approval_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {k: v for k, v in approval_data.items() if v is not None}
            res = client.table("approval_queue").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert approval item into Supabase: {e}")
            return None

    @classmethod
    def update_approval_status(cls, approval_id: str, status: str, approved_by: Optional[str] = None, comments: Optional[str] = None) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            update_payload = {"status": status}
            if approved_by:
                update_payload["approved_by"] = approved_by
            if comments:
                update_payload["comments"] = comments
            res = client.table("approval_queue").update(update_payload).eq("id", approval_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to update approval item in Supabase: {e}")
            return None

    @classmethod
    def log_audit_event(cls, action: str, entity_type: str, entity_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "payload": payload or {},
                "user_id": user_id
            }
            res = client.table("audit_log").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to log audit event in Supabase: {e}")
            return None

    @classmethod
    def insert_mission_memory(cls, session_id: str, event_type: str, key_outcomes: Dict[str, Any], authority_boundary: str = "OPERATOR_ONLY") -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {
                "session_id": session_id,
                "event_type": event_type,
                "key_outcomes": key_outcomes,
                "authority_boundary": authority_boundary
            }
            res = client.table("mission_memory").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert mission memory into Supabase: {e}")
            return None

    @classmethod
    def get_activity_schedules(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return []
        try:
            res = client.table("activity_schedules").select("*").order("start_time", desc=False).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to fetch activity schedules: {e}")
            return []

    @classmethod
    def insert_activity_schedule(cls, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            from datetime import datetime, timezone
            now_iso = datetime.now(timezone.utc).isoformat()
            data = {
                "activity_name": item.get("activity_name", "Flight Command Activity"),
                "activity_type": item.get("activity_type", "MAINTENANCE"),
                "status": item.get("status", "IN_PROGRESS"),
                "priority": item.get("priority", 1),
                "start_time": item.get("start_time") if "202" in str(item.get("start_time")) else now_iso,
                "end_time": item.get("end_time") if "202" in str(item.get("end_time")) else now_iso,
                "resource_requirements": item.get("resource_requirements", {}),
                "precedence_constraints": item.get("precedence_constraints", []),
                "selection_rationale": item.get("selection_rationale", "Authorized by Flight Controller")
            }
            res = client.table("activity_schedules").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert activity schedule: {e}")
            return None

    @classmethod
    def get_communication_windows(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return []
        try:
            res = client.table("communication_windows").select("*").order("start_time", desc=False).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to fetch communication windows: {e}")
            return []
