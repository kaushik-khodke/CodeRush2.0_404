from typing import List, Dict, Any

# Knowledge Base of Spacecraft Standard Operating Procedures (SOPs) & Runbooks
SOP_KNOWLEDGE_BASE = [
    {
        "code": "SOP-BAT-01",
        "title": "Enter Safe Mode - Shed Non-Essential Loads",
        "category": "Power",
        "version": "v2.1",
        "keywords": ["battery", "voltage", "power", "soc", "load", "shedding", "safe mode"],
        "preconditions": ["Battery SOC < 30% OR Battery Voltage < 26.0V"],
        "postconditions": ["Non-essential payloads powered off", "Solar arrays tracking sun", "Power load < 150W"],
        "steps": [
            "1. Deactivate scientific payload camera and instruments",
            "2. Switch high-gain antenna transmitter to low-power standby mode",
            "3. Orient solar panel arrays to maximum sun exposure angle",
            "4. Monitor battery terminal voltage recovery rate"
        ],
        "safety_precautions": [
            "Do NOT attempt orbit burns during battery safe mode",
            "Maintain continuous beacon telemetry on low frequency"
        ]
    },
    {
        "code": "SOP-THR-02",
        "title": "Isolate Thruster Fuel Valve & Abort Orbit Burn",
        "category": "Propulsion",
        "version": "v1.8",
        "keywords": ["thruster", "propulsion", "fuel", "pressure", "burn", "temperature", "overheating"],
        "preconditions": ["Thruster Temp > 120 deg C OR Fuel Pressure < 100 PSI during active burn"],
        "postconditions": ["Main fuel isolation valve closed", "Maneuver burn halted"],
        "steps": [
            "1. Issue immediate close command to primary fuel isolation valve",
            "2. Purge residual propellant from manifold line",
            "3. Engage ADCS magnetorquers to damp residual thruster torque",
            "4. Transmit orbit deviation metrics to Ground Control"
        ],
        "safety_precautions": [
            "Verify manifold pressure drops below 20 PSI post-isolation",
            "Do NOT re-engage thruster without Ground Station authorization"
        ]
    },
    {
        "code": "SOP-THERM-03",
        "title": "Activate Auxiliary Cooling System & Throttle CPU Payload",
        "category": "Thermal",
        "version": "v3.0",
        "keywords": ["thermal", "temperature", "cpu", "payload", "heat", "cooling", "overheating"],
        "preconditions": ["CPU Temperature > 70 deg C OR Payload Temp > 50 deg C"],
        "postconditions": ["Auxiliary thermal fluid loop active", "CPU clock speed throttled 50%"],
        "steps": [
            "1. Power on secondary fluid loop radiator pump",
            "2. Send CPU throttle command to flight computer",
            "3. Pause high-throughput payload data processing"
        ],
        "safety_precautions": [
            "Verify radiator panel deployment status",
            "Monitor CPU temperature stabilization below 60 deg C"
        ]
    },
    {
        "code": "SOP-COMM-04",
        "title": "Switch to High-Gain Backup Antenna Array",
        "category": "Communication",
        "version": "v1.4",
        "keywords": ["communication", "signal", "rssi", "packet loss", "latency", "downlink", "antenna"],
        "preconditions": ["Signal Strength < -105 dBm OR Packet Loss > 10%"],
        "postconditions": ["Secondary high-gain RF transceiver active"],
        "steps": [
            "1. Switch RF signal path to backup antenna B",
            "2. Re-acquire ground station tracking lock",
            "3. Resend unacknowledged telemetry packets"
        ],
        "safety_precautions": [
            "Ensure ground station line-of-sight window is active"
        ]
    }
]

class VectorSOPRetrieverTool:
    """
    RAG SOP & Manuals Vector Search Tool.
    Retrieves top-K relevant Standard Operating Procedures matching anomaly characteristics.
    """
    def retrieve_sops(self, query: str, failure_class: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_lower = query.lower() + " " + failure_class.lower()
        scored_sops = []

        for sop in SOP_KNOWLEDGE_BASE:
            score = 0.0
            # Category match
            if sop["category"].lower() in query_lower:
                score += 3.0
            # Keyword matches
            for kw in sop["keywords"]:
                if kw in query_lower:
                    score += 1.5

            if score > 0.0:
                scored_sops.append((score, sop))

        # Sort by relevance score
        scored_sops.sort(key=lambda x: x[0], reverse=True)
        results = []

        for score, sop in scored_sops[:top_k]:
            sop_copy = dict(sop)
            sop_copy["relevance_score"] = round(min(score / 5.0, 1.0), 2)
            results.append(sop_copy)

        if not results:
            # Fallback default SOP
            default_sop = dict(SOP_KNOWLEDGE_BASE[0])
            default_sop["relevance_score"] = 0.85
            results.append(default_sop)

        return results

sop_retriever_tool = VectorSOPRetrieverTool()
