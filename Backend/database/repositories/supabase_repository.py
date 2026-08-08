import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class SupabaseRepository:
    """
    Direct Enterprise integration repository with Supabase Cloud PostgreSQL.
    Manages persistence, seeding, queries, and CDC realtime updates across ALL 14 schema tables:
    1. telemetry_data
    2. predictions
    3. anomalies
    4. approval_queue
    5. procedures
    6. audit_log
    7. mission_memory
    8. activity_schedules
    9. communication_windows
    10. mission_constraints
    11. mission_plan
    12. fault_injection
    13. simulation_replays
    14. users
    """
    
    @staticmethod
    def is_available() -> bool:
        client = get_supabase_client()
        return client is not None

    # ----------------------------------------------------------------------------
    # 1. TELEMETRY DATA
    # ----------------------------------------------------------------------------
    @classmethod
    def insert_telemetry(cls, telemetry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {k: v for k, v in telemetry_data.items() if v is not None}
            res = client.table("telemetry_data").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert telemetry into Supabase: {e}")
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

    # ----------------------------------------------------------------------------
    # 2. PREDICTIONS
    # ----------------------------------------------------------------------------
    @classmethod
    def insert_prediction(cls, prediction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {k: v for k, v in prediction_data.items() if v is not None}
            if "telemetry_id" not in data or not data["telemetry_id"]:
                latest_id = cls.get_latest_telemetry_id()
                if latest_id:
                    data["telemetry_id"] = latest_id
                else:
                    return None
            res = client.table("predictions").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert prediction into Supabase: {e}")
            return None

    # ----------------------------------------------------------------------------
    # 3. ANOMALIES
    # ----------------------------------------------------------------------------
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

    # ----------------------------------------------------------------------------
    # 4. APPROVAL QUEUE
    # ----------------------------------------------------------------------------
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

    # ----------------------------------------------------------------------------
    # 5. PROCEDURES (SOP Runbooks)
    # ----------------------------------------------------------------------------
    @classmethod
    def get_procedures(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return []
        try:
            res = client.table("procedures").select("*").execute()
            return res.data or []
        except Exception:
            return []

    # ----------------------------------------------------------------------------
    # 6. AUDIT LOG
    # ----------------------------------------------------------------------------
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

    # ----------------------------------------------------------------------------
    # 7. MISSION MEMORY
    # ----------------------------------------------------------------------------
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

    # ----------------------------------------------------------------------------
    # 8. ACTIVITY SCHEDULES
    # ----------------------------------------------------------------------------
    @classmethod
    def get_activity_schedules(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return []
        try:
            res = client.table("activity_schedules").select("*").order("start_time", desc=True).execute()
            items = res.data or []

            # Enforce Strict Max 9 Active Tasks Rule: Only 9 tasks active at a time.
            # Mark any overflow active tasks as "COMPLETED" in the database!
            active_statuses = {"IN_PROGRESS", "SCHEDULED", "PENDING", "ACTIVE"}
            active_items = [item for item in items if item.get("status") in active_statuses]

            if len(active_items) > 9:
                overflow_ids = [item.get("id") for item in active_items[9:] if item.get("id")]
                if overflow_ids:
                    try:
                        client.table("activity_schedules").update({"status": "COMPLETED"}).in_("id", overflow_ids).execute()
                        for item in active_items[9:]:
                            item["status"] = "COMPLETED"
                    except Exception as overflow_err:
                        logger.warning(f"[Supabase Sync Notice] Overflow tasks auto-completion notice: {overflow_err}")

            # Remove COMPLETED tasks older than 1 hour (3600 seconds) from queue & database
            now_dt = datetime.now(timezone.utc)
            one_hour_ago = now_dt - timedelta(hours=1)

            valid_items = []
            expired_completed_ids = []
            for item in items:
                status = item.get("status")
                end_time_str = item.get("end_time") or item.get("start_time")

                is_expired_completed = False
                if status == "COMPLETED" and end_time_str:
                    try:
                        clean_str = str(end_time_str).replace("Z", "+00:00")
                        dt = datetime.fromisoformat(clean_str)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        if dt < one_hour_ago:
                            is_expired_completed = True
                    except Exception:
                        pass

                if is_expired_completed and item.get("id"):
                    expired_completed_ids.append(item.get("id"))
                else:
                    valid_items.append(item)

            if expired_completed_ids:
                try:
                    client.table("activity_schedules").delete().in_("id", expired_completed_ids).execute()
                except Exception as del_err:
                    logger.warning(f"[Supabase Sync Notice] Pruned 1h completed tasks notice: {del_err}")

            return valid_items
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to fetch activity schedules: {e}")
            return []

    @classmethod
    def insert_activity_schedule(cls, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            data = {
                "activity_name": item.get("activity_name", "Flight Command Activity"),
                "activity_type": item.get("activity_type", "OBSERVATION"),
                "status": item.get("status", "SCHEDULED"),
                "priority": item.get("priority", 1),
                "start_time": item.get("start_time") if "202" in str(item.get("start_time")) else now_iso,
                "end_time": item.get("end_time") if "202" in str(item.get("end_time")) else now_iso,
                "resource_requirements": item.get("resource_requirements", {}),
                "precedence_constraints": item.get("precedence_constraints", []),
                "selection_rationale": item.get("selection_rationale", "Authorized by Flight Controller")
            }

            # Enforce Max 9 Active Tasks Rule before inserting new activity
            cls.get_activity_schedules()

            res = client.table("activity_schedules").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning(f"[Supabase Sync Warning] Failed to insert activity schedule: {e}")
            return None

    # ----------------------------------------------------------------------------
    # 9. COMMUNICATION WINDOWS
    # ----------------------------------------------------------------------------
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

    # ----------------------------------------------------------------------------
    # 10. MISSION CONSTRAINTS
    # ----------------------------------------------------------------------------
    @classmethod
    def get_mission_constraints(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return []
        try:
            res = client.table("mission_constraints").select("*").execute()
            return res.data or []
        except Exception:
            return []

    # ----------------------------------------------------------------------------
    # 11. MISSION PLAN
    # ----------------------------------------------------------------------------
    @classmethod
    def get_active_mission_plan(cls) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            res = client.table("mission_plan").select("*").eq("status", "ACTIVE").limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception:
            return None

    # ----------------------------------------------------------------------------
    # 12. FAULT INJECTION LOGGING
    # ----------------------------------------------------------------------------
    @classmethod
    def log_fault_injection(cls, fault_type: str, subsystem: str, parameters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {
                "fault_type": fault_type,
                "subsystem": subsystem,
                "parameters": parameters,
                "active": True
            }
            res = client.table("fault_injection").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception:
            return None

    # ----------------------------------------------------------------------------
    # 13. SIMULATION REPLAYS
    # ----------------------------------------------------------------------------
    @classmethod
    def insert_simulation_replay(cls, session_name: str, telemetry_snapshot_ids: List[str], outcomes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if not client:
            return None
        try:
            data = {
                "session_name": session_name,
                "telemetry_snapshot_ids": telemetry_snapshot_ids,
                "simulated_outcomes": outcomes
            }
            res = client.table("simulation_replays").insert(data).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception:
            return None

    # ----------------------------------------------------------------------------
    # 14. SEED INITIAL STATIC TABLES IF EMPTY
    # ----------------------------------------------------------------------------
    @classmethod
    def seed_initial_data(cls):
        """
        Seeds default static records into mission_plan, communication_windows,
        mission_constraints, procedures, and users if they are currently empty in Supabase.
        """
        client = get_supabase_client()
        if not client:
            return

        now_iso = datetime.now(timezone.utc).isoformat()

        # Seed Users
        try:
            users_res = client.table("users").select("id").limit(1).execute()
            if not users_res.data:
                client.table("users").insert([
                    {"email": "flight_director@smoa.space", "full_name": "Flight Director", "role": "flight_director"},
                    {"email": "operator_01@smoa.space", "full_name": "Mission Controller Alpha", "role": "operator"},
                    {"email": "system_agent@smoa.space", "full_name": "Autonomous AI Agent", "role": "system_agent"}
                ]).execute()
                logger.info("[Supabase Seeding] Seeded default users.")
        except Exception as e:
            logger.info(f"[Supabase Seeding Note] Users table seed note: {e}")

        # Seed Mission Plan
        try:
            plan_res = client.table("mission_plan").select("id").limit(1).execute()
            if not plan_res.data:
                client.table("mission_plan").insert([
                    {
                        "mission_name": "SMOA-Helios-1",
                        "phase": "MAPPING_OBSERVATION",
                        "status": "ACTIVE",
                        "target_orbit": "LEO 520km Sun-Synchronous"
                    }
                ]).execute()
                logger.info("[Supabase Seeding] Seeded active mission plan.")
        except Exception as e:
            logger.info(f"[Supabase Seeding Note] Mission plan seed note: {e}")

        # Seed Communication Windows
        try:
            cw_res = client.table("communication_windows").select("id").limit(1).execute()
            if not cw_res.data:
                client.table("communication_windows").insert([
                    {
                        "ground_station_name": "SGS Svalbard (Norway)",
                        "start_time": now_iso,
                        "end_time": now_iso,
                        "max_elevation": 68.4,
                        "available_bandwidth_mbps": 50.0,
                        "status": "UPCOMING"
                    },
                    {
                        "ground_station_name": "Goldstone DSCC (USA)",
                        "start_time": now_iso,
                        "end_time": now_iso,
                        "max_elevation": 82.1,
                        "available_bandwidth_mbps": 120.0,
                        "status": "UPCOMING"
                    }
                ]).execute()
                logger.info("[Supabase Seeding] Seeded ground station pass windows.")
        except Exception as e:
            logger.info(f"[Supabase Seeding Note] Communication windows seed note: {e}")

        # Seed Mission Constraints
        try:
            mc_res = client.table("mission_constraints").select("id").limit(1).execute()
            if not mc_res.data:
                client.table("mission_constraints").insert([
                    {"parameter_name": "Battery_SOC", "min_value": 35.0, "max_value": 100.0, "unit": "%", "description": "Minimum battery depth of discharge threshold", "is_critical": True},
                    {"parameter_name": "CPU_Temperature", "min_value": -10.0, "max_value": 70.0, "unit": "deg C", "description": "Maximum flight computer thermal limit", "is_critical": True},
                    {"parameter_name": "Fuel_Level", "min_value": 15.0, "max_value": 100.0, "unit": "%", "description": "Minimum propulsion reserve fuel level", "is_critical": True}
                ]).execute()
                logger.info("[Supabase Seeding] Seeded mission safety constraints.")
        except Exception as e:
            logger.info(f"[Supabase Seeding Note] Constraints seed note: {e}")

        # Seed Procedures (SOP Runbooks)
        try:
            proc_res = client.table("procedures").select("id").limit(1).execute()
            if not proc_res.data:
                client.table("procedures").insert([
                    {
                        "code": "SOP-POWER-01",
                        "title": "Safe Mode Contingency Load Shedding",
                        "category": "POWER_EMERGENCY",
                        "version": 1,
                        "preconditions": ["Battery_SOC < 35%"],
                        "steps": ["Shutdown Multispectral Payload Camera", "Deactivate High-Band Ku Transmitter", "Orient Solar Array to Sun-Vector"],
                        "safety_precautions": ["Ensure Star Tracker attitude lock maintained before array rotation"]
                    },
                    {
                        "code": "SOP-THERM-02",
                        "title": "Coolant Loop B Activation & Auxiliary Pump Ramp",
                        "category": "THERMAL_MANAGEMENT",
                        "version": 1,
                        "preconditions": ["CPU_Temperature > 65°C"],
                        "steps": ["Engage Secondary Loop-B Pump at 110%", "Open Heat-Pipe Radiator Valve"],
                        "safety_precautions": ["Verify bus power margin > 40W before pump ramp"]
                    }
                ]).execute()
                logger.info("[Supabase Seeding] Seeded SOP emergency procedures.")
        except Exception as e:
            logger.info(f"[Supabase Seeding Note] Procedures seed note: {e}")
