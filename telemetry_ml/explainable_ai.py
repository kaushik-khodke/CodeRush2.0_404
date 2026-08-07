import numpy as np
import pandas as pd

class MissionExplainableAI:
    """
    Explainable AI (XAI) & Operator Decision Support Engine.
    Conforms strictly to Section 3 and Section 7 of 'ml execution.pdf'.
    """
    def __init__(self, feature_names):
        self.feature_names = feature_names
        
        # Nominal bounds derived from PDF specification
        self.nominal_bounds = {
            "Battery_Voltage": (26.0, 32.0),
            "Battery_Current": (0.0, 10.0),
            "Battery_SOC": (30.0, 100.0),       # Constraint > 30%
            "Solar_Voltage": (25.0, 45.0),
            "Solar_Current": (2.0, 25.0),
            "Power_Load": (100.0, 400.0),
            "Power_Generation": (150.0, 600.0),
            "Battery_Temperature": (10.0, 45.0),
            "CPU_Temperature": (20.0, 70.0),     # Constraint < 70°C
            "Payload_Temperature": (15.0, 50.0),
            "System_Temp": (15.0, 50.0),
            "Fuel_Level": (10.0, 100.0),         # Constraint > 10%
            "Signal_Strength": (-105.0, -50.0),
            "Packet_Loss": (0.0, 5.0),
            "CPU_Usage": (0.0, 90.0),            # Constraint < 90%
            "RAM_Usage": (0.0, 85.0),
            "Storage_Usage": (0.0, 95.0)         # Constraint < 95%
        }

    def evaluate_constraints(self, sample_dict):
        """
        Verifies constraint parameters from PDF Section 3.
        """
        violations = []
        if sample_dict.get("Battery_SOC", 100) < 30.0:
            violations.append("Constraint Violation: Battery < 30%")
        if sample_dict.get("CPU_Temperature", 40) > 70.0:
            violations.append("Constraint Violation: Temperature > 70 deg C")
        if sample_dict.get("Fuel_Level", 50) < 10.0:
            violations.append("Constraint Violation: Fuel < 10%")
        if sample_dict.get("CPU_Usage", 30) > 90.0:
            violations.append("Constraint Violation: CPU < 90%")
        if sample_dict.get("Storage_Usage", 50) > 95.0:
            violations.append("Constraint Violation: Storage < 95%")
        return violations

    def extract_evidence(self, sample_dict):
        """
        Generates feature evidence vector (e.g. Battery_Voltage [LOW], CPU_Temperature [HIGH]).
        Matches PDF Section 7 cleanly across Windows terminals.
        """
        evidence = []
        for feature, (min_v, max_v) in self.nominal_bounds.items():
            if feature in sample_dict:
                val = sample_dict[feature]
                if val < min_v:
                    evidence.append(f"{feature} [LOW] ({val:.1f})")
                elif val > max_v:
                    evidence.append(f"{feature} [HIGH] ({val:.1f})")

        if not evidence:
            evidence = ["All telemetry parameters within nominal thresholds"]
        return evidence

    def recommend_procedure(self, failure_class, constraint_violations):
        """
        Returns operator recommended procedures matching PDF Section 7 & 10.
        """
        if "Battery Failure" in failure_class or "Battery < 30%" in str(constraint_violations):
            return "Enter Safe Mode - Shed Non-Essential Loads"
        elif "Solar Panel Failure" in failure_class:
            return "Re-orient Solar Arrays toward Sun & Initiate Power Saver"
        elif "Thermal Anomaly" in failure_class or "Temperature > 70" in str(constraint_violations):
            return "Activate Auxiliary Cooling System & Throttle CPU Payload"
        elif "Communication Failure" in failure_class:
            return "Switch to High-Gain Backup Antenna Array"
        elif "Propulsion Failure" in failure_class:
            return "Isolate Thruster Fuel Valve & Abort Orbit Burn"
        elif "Attitude Control Failure" in failure_class:
            return "Reset Reaction Wheels & Engage Magnetorquers"
        elif "Safe Mode Required" in failure_class or len(constraint_violations) > 1:
            return "Enter Safe Mode - Standby for Ground Station Override"
        else:
            return "Continue Nominal Mission Operations"

    def generate_xai_card(self, sample_dict, failure_class, confidence, remaining_battery, temp_30m, anomaly_score):
        """
        Formats full Explainable AI output card matching PDF Section 7.
        """
        violations = self.evaluate_constraints(sample_dict)
        evidence = self.extract_evidence(sample_dict)
        procedure = self.recommend_procedure(failure_class, violations)

        risk_level = "High" if failure_class != "Healthy" or violations else "Low"

        card = {
            "Failure_Class": failure_class,
            "Confidence": f"{confidence * 100:.1f}%",
            "Anomaly_Score": f"{anomaly_score:.3f}",
            "Evidence": evidence,
            "Constraint_Violations": violations,
            "Recommended_Procedure": procedure,
            "Estimated_Risk": risk_level,
            "Predictive_Metrics": {
                "Remaining_Battery_Life": f"{remaining_battery:.1f} hours",
                "Est_CPU_Temp_30min": f"{temp_30m:.1f} deg C"
            }
        }
        return card
