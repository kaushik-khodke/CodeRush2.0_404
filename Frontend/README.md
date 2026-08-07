# ORION AI — Mission Operations Copilot (Frontend)

A frontend mockup of the ORION AI mission-control dashboard: agent roster,
digital twin view, live telemetry, explainable anomaly reasoning, and a
human-approval gate for AI recommendations.

Built with **React + Vite**, no backend required — all data in
`src/data/missionData.js` is static mock data so you can run it immediately
and wire up real telemetry/agent APIs later.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  App.jsx                 // layout shell
  data/missionData.js      // mock spacecraft, agents, telemetry, anomaly, recs
  components/
    TopBar.jsx              // mission status header
    AgentRoster.jsx          // AI agent "console" list (Sentinel, Cartographer, ...)
    DigitalTwinPanel.jsx     // simplified spacecraft schematic
    TelemetryPanel.jsx       // live channel cards with sparklines
    AnomalyPanel.jsx         // root-cause hypotheses with evidence + confidence
    RecommendationFeed.jsx   // risk-scored, simulated recommendations + approve/reject
    AuditLog.jsx             // scrolling decision/action trail
```

## Wiring up real data

Replace the static exports in `src/data/missionData.js` with data from your
backend (REST/WebSocket). Each component receives plain props, so no other
changes are required — swap the data source and the UI updates automatically.

`RecommendationFeed`'s `onDecide(id, 'approved' | 'rejected')` callback is
where you'd call your execution/authorization API once a human operator
approves or rejects a recommendation — nothing here executes automatically.
