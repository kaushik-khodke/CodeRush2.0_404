// Static mock data standing in for live telemetry / agent feeds.
// Swap these for real API/websocket sources when wiring up the backend.

export const spacecraft = {
  name: 'ARGUS-7',
  mission: 'Lunar Relay & Comms Platform',
  orbit: 'Trans-Lunar Halo (L2)',
  missionElapsed: '412d 06h 12m',
  overallHealth: 'CAUTION'
};

export const agents = [
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Telemetry & Anomaly Watch',
    status: 'active',
    confidence: 0.97,
    lastAction: 'Flagged bus voltage drift on EPS-2, 00:41 ago'
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    role: 'Digital Twin & Simulation',
    status: 'active',
    confidence: 0.93,
    lastAction: 'Ran 3 what-if thermal simulations for safe-mode entry'
  },
  {
    id: 'archivist',
    name: 'Archivist',
    role: 'RAG Recovery Procedures',
    status: 'active',
    confidence: 0.89,
    lastAction: 'Retrieved FDIR-EPS-014 procedure, 3 similar past incidents'
  },
  {
    id: 'planner',
    name: 'Planner',
    role: 'Mission Continuation & Replanning',
    status: 'standby',
    confidence: 0.91,
    lastAction: 'Drafted replan preserving 2 of 2 science windows'
  },
  {
    id: 'warden',
    name: 'Warden',
    role: 'Safety & Authorization Gate',
    status: 'watching',
    confidence: 1.0,
    lastAction: 'Blocking auto-execution — awaiting operator approval'
  }
];

export const telemetryChannels = [
  {
    id: 'eps2-bus-v',
    label: 'EPS-2 Bus Voltage',
    unit: 'V',
    nominal: [27.6, 28.4],
    current: 26.8,
    trend: 'falling',
    series: [28.2, 28.1, 28.0, 27.9, 27.6, 27.3, 27.0, 26.8]
  },
  {
    id: 'eps2-bus-i',
    label: 'EPS-2 Bus Current',
    unit: 'A',
    nominal: [4.0, 6.5],
    current: 7.4,
    trend: 'rising',
    series: [5.1, 5.3, 5.6, 6.0, 6.4, 6.9, 7.1, 7.4]
  },
  {
    id: 'batt-temp',
    label: 'Battery Pack Temp',
    unit: '°C',
    nominal: [5, 25],
    current: 21.3,
    trend: 'rising',
    series: [14.2, 15.0, 16.1, 17.4, 18.8, 19.9, 20.6, 21.3]
  },
  {
    id: 'star-tracker',
    label: 'Star Tracker Lock',
    unit: '%',
    nominal: [98, 100],
    current: 99.4,
    trend: 'stable',
    series: [99.2, 99.3, 99.5, 99.4, 99.4, 99.3, 99.4, 99.4]
  }
];

export const anomaly = {
  id: 'AN-2044',
  title: 'EPS-2 Bus Voltage Droop with Rising Current Draw',
  severity: 'CAUTION',
  detectedBy: 'Sentinel',
  detectedAt: 'T+412d 05h 31m',
  confidence: 0.94,
  rootCauseHypotheses: [
    {
      cause: 'Degraded solar array string (Panel B, string 3)',
      probability: 0.61,
      evidence: [
        'Current draw compensating for ~9% power shortfall vs. array model',
        'Pattern matches string degradation in 2 prior missions (Archivist)',
        'No correlated eclipse or attitude event at onset'
      ]
    },
    {
      cause: 'Battery cell impedance increase',
      probability: 0.27,
      evidence: [
        'Battery temp trending up 0.9°C/orbit, mildly correlated',
        'Charge/discharge asymmetry within nominal bounds — weak signal'
      ]
    },
    {
      cause: 'Sensor/telemetry fault on EPS-2 monitor',
      probability: 0.12,
      evidence: [
        'Cross-checked against EPS-1 redundant bus — no matching drift',
        'Low likelihood given consistent trend over 8 samples'
      ]
    }
  ]
};

export const recommendations = [
  {
    id: 'REC-118',
    title: 'Load-shed non-essential payload heater on EPS-2 bus',
    agent: 'Planner',
    riskScore: 'LOW',
    confidence: 0.92,
    reversible: true,
    simulated: true,
    simulationResult: 'Stabilizes bus voltage to 27.9V within 6 min. No science impact.',
    preservesObjectives: '2 of 2 active science windows preserved',
    status: 'pending_approval'
  },
  {
    id: 'REC-119',
    title: 'Reconfigure to redundant EPS-1 bus for payload heater string',
    agent: 'Planner',
    riskScore: 'MEDIUM',
    confidence: 0.85,
    reversible: true,
    simulated: true,
    simulationResult: 'Fully resolves droop. Adds 4.2W load to EPS-1 — within margin.',
    preservesObjectives: '2 of 2 active science windows preserved',
    status: 'pending_approval'
  },
  {
    id: 'REC-120',
    title: 'Enter EPS safe-mode and abort current science window',
    agent: 'Warden',
    riskScore: 'HIGH',
    confidence: 0.4,
    reversible: false,
    simulated: true,
    simulationResult: 'Guarantees safety margin but drops 1 of 2 science windows.',
    preservesObjectives: '1 of 2 active science windows preserved',
    status: 'not_recommended'
  }
];

export const auditLog = [
  { t: 'T+412d 05h 31m', actor: 'Sentinel', event: 'Anomaly AN-2044 detected, confidence 0.94' },
  { t: 'T+412d 05h 33m', actor: 'Cartographer', event: 'Digital twin sync complete, 3 simulations queued' },
  { t: 'T+412d 05h 36m', actor: 'Archivist', event: 'Retrieved FDIR-EPS-014 + 2 related past incidents' },
  { t: 'T+412d 05h 39m', actor: 'Planner', event: 'Generated REC-118, REC-119 — objectives preserved' },
  { t: 'T+412d 05h 40m', actor: 'Warden', event: 'REC-120 marked high-risk, execution gate closed' },
  { t: 'T+412d 05h 41m', actor: 'System', event: 'Awaiting human operator decision on REC-118 / REC-119' }
];
