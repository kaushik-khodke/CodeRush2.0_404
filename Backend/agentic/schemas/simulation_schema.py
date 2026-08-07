from pydantic import BaseModel, Field

class SimulationOutput(BaseModel):
    expected_outcome: str
    battery_impact_percent: float
    fuel_impact_percent: float
    temperature_trend_deg_c: float
    mission_delay_minutes: float
    success_probability: float = Field(..., ge=0.0, le=1.0)
    simulation_notes: str
