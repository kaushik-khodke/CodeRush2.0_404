import { useState, useEffect, useRef } from 'react';
import TopBar from './components/TopBar.jsx';
import AgentRoster from './components/AgentRoster.jsx';
import DigitalTwinPanel from './components/DigitalTwinPanel.jsx';
import TelemetryPanel from './components/TelemetryPanel.jsx';
import TelemetryTable from './components/TelemetryTable.jsx';
import MissionTimeline from './components/MissionTimeline.jsx';
import AnomalyPanel from './components/AnomalyPanel.jsx';
import RecommendationFeed from './components/RecommendationFeed.jsx';
import AuditLog from './components/AuditLog.jsx';
import ToastContainer from './components/ToastContainer.jsx';

import { evaluateChannelSeverity } from './lib/conditions.js';
import { BASE_MET_SECONDS, formatMET } from './lib/time.js';

import {
  spacecraft as initialSpacecraft,
  agents as initialAgents,
  telemetryChannels as initialTelemetryChannels,
  anomaly as initialAnomaly,
  recommendations as initialRecommendations,
  auditLog as initialAuditLog
} from './data/missionData.js';

import './App.css';

export default function App() {
  const [metSeconds, setMetSeconds] = useState(BASE_MET_SECONDS);
  const [selectedAgentId, setSelectedAgentId] = useState('sentinel');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dynamic collections
  const [channels, setChannels] = useState(() =>
    initialTelemetryChannels.map((ch) => ({
      ...ch,
      status: evaluateChannelSeverity(ch.id, ch.current),
      series: [...ch.series]
    }))
  );
  const [recs, setRecs] = useState(initialRecommendations);
  const [logs, setLogs] = useState(initialAuditLog);
  
  // Interactive decisions, hovers & toasts
  const [decisions, setDecisions] = useState({});
  const [hoveredRecId, setHoveredRecId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Column Resizer Widths (in pixels)
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(360);

  const resizerRef = useRef({ isDraggingLeft: false, isDraggingRight: false });

  // 1. Simulation and clock tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMetSeconds((prevMet) => {
        const nextMet = prevMet + 1;

        // Dynamic Simulation Events at specific elapsed times
        const elapsedSecs = nextMet - BASE_MET_SECONDS;
        if (elapsedSecs === 10) {
          // Trigger simulated recommendation
          const recId = 'REC-121';
          const newRec = {
            id: recId,
            title: 'Optimize solar array panel B orientation to improve solar yield (+0.6W)',
            agent: 'Planner',
            riskScore: 'LOW',
            confidence: 0.94,
            reversible: true,
            simulated: true,
            simulationResult: 'Reduces EPS-2 compensate load by shifting array angle. Resolves voltage drift over 15 min.',
            preservesObjectives: '2 of 2 active science windows preserved',
            status: 'pending_approval'
          };
          setRecs((prev) => [...prev, newRec]);
          setLogs((prev) => [
            ...prev,
            {
              t: formatMET(nextMet),
              actor: 'Planner',
              event: `Generated ${recId} — low-risk solar yield optimization`
            }
          ]);
          triggerToast('New Recommendation', `Planner generated ${recId}: Optimize solar array B angle`, 'INFO', nextMet);
        } else if (elapsedSecs === 20) {
          // Trigger battery temperature limit warning
          setChannels((prevChannels) =>
            prevChannels.map((ch) => {
              if (ch.id === 'batt-temp') {
                const spikedSeries = [...ch.series, 25.1];
                if (spikedSeries.length > 50) spikedSeries.shift();
                return {
                  ...ch,
                  current: 25.1,
                  series: spikedSeries,
                  status: 'CAUTION',
                  trend: 'rising'
                };
              }
              return ch;
            })
          );
          setLogs((prev) => [
            ...prev,
            {
              t: formatMET(nextMet),
              actor: 'Sentinel',
              event: 'Battery Pack Temperature breached CAUTION high limit of 25.0°C'
            }
          ]);
          triggerToast('Telemetry Alarm', 'Battery Pack Temp reached CAUTION high limit (25.1°C)', 'CAUTION', nextMet);
        }

        return nextMet;
      });

      // Update Telemetry values (drift / correction loop)
      setChannels((prevChannels) => {
        return prevChannels.map((ch) => {
          let val = ch.current;
          let trend = ch.trend;

          // Check if decisions have resolved EPS-2 issues
          const isRec118Approved = decisions['REC-118']?.type === 'approved';
          const isRec119Approved = decisions['REC-119']?.type === 'approved';
          const isRec120Approved = decisions['REC-120']?.type === 'approved';

          if (ch.id === 'eps2-bus-v') {
            if (isRec120Approved) {
              val = val + (28.2 - val) * 0.15 + (Math.random() - 0.5) * 0.05;
              trend = val > ch.current ? 'rising' : 'stable';
            } else if (isRec119Approved) {
              val = val + (28.0 - val) * 0.12 + (Math.random() - 0.5) * 0.05;
              trend = val > ch.current ? 'rising' : 'stable';
            } else if (isRec118Approved) {
              val = val + (27.9 - val) * 0.1 + (Math.random() - 0.5) * 0.05;
              trend = val > ch.current ? 'rising' : 'stable';
            } else {
              // Drift downwards
              val = val - 0.02 + (Math.random() - 0.6) * 0.03;
              if (val < 26.0) val = 26.0;
              trend = 'falling';
            }
          } else if (ch.id === 'eps2-bus-i') {
            if (isRec120Approved) {
              val = val - (val - 4.0) * 0.15 + (Math.random() - 0.5) * 0.08;
              trend = val < ch.current ? 'falling' : 'stable';
            } else if (isRec119Approved) {
              val = val - (val - 4.5) * 0.12 + (Math.random() - 0.5) * 0.08;
              trend = val < ch.current ? 'falling' : 'stable';
            } else if (isRec118Approved) {
              val = val - (val - 5.5) * 0.1 + (Math.random() - 0.5) * 0.08;
              trend = val < ch.current ? 'falling' : 'stable';
            } else {
              // Drift upwards
              val = val + 0.03 + (Math.random() - 0.4) * 0.04;
              if (val > 7.8) val = 7.8;
              trend = 'rising';
            }
          } else if (ch.id === 'batt-temp') {
            if (isRec120Approved) {
              val = val - (val - 15.0) * 0.08 + (Math.random() - 0.5) * 0.1;
              trend = 'falling';
            } else {
              // Mild drift/oscillation around nominal or slightly rising
              val = val + (Math.random() - 0.48) * 0.15;
              trend = val > ch.current ? 'rising' : 'falling';
            }
          } else if (ch.id === 'star-tracker') {
            // Very stable nominal signal
            val = 99.4 + (Math.random() - 0.5) * 0.15;
            if (val > 100.0) val = 100.0;
            trend = Math.abs(val - ch.current) < 0.05 ? 'stable' : val > ch.current ? 'rising' : 'falling';
          }

          // Build series history
          const nextSeries = [...ch.series, val];
          if (nextSeries.length > 100) {
            nextSeries.shift();
          }

          return {
            ...ch,
            current: val,
            trend,
            series: nextSeries,
            status: evaluateChannelSeverity(ch.id, val)
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [decisions]);

  // 2. Toast triggering helper
  const triggerToast = (title, message, severity, timestampSec) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        message,
        severity,
        timestamp: formatMET(timestampSec || metSeconds)
      }
    ]);
  };

  const handleCloseToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 3. Recommendation decision (Approve/Reject) with Notebook operator note
  const handleDecide = (id, type, note) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { type, note }
    }));

    // Add entry to Audit Log
    setLogs((prev) => [
      ...prev,
      {
        t: formatMET(metSeconds),
        actor: 'Operator',
        event: `Resolved ${id} as ${type.toUpperCase()}`,
        note: note || undefined
      }
    ]);

    // Push confirm toast
    triggerToast(
      type === 'approved' ? 'Action Approved' : 'Action Rejected',
      `Operator ${type === 'approved' ? 'approved' : 'rejected'} ${id}.`,
      type === 'approved' ? 'NOMINAL' : 'CAUTION',
      metSeconds
    );
  };

  // 4. Vehicle health rollup calculation
  const overallHealth = (() => {
    const statuses = channels.map((c) => c.status);
    if (statuses.includes('CRITICAL')) return 'CRITICAL';
    if (statuses.includes('CAUTION')) return 'CAUTION';
    return 'NOMINAL';
  })();

  const statefulSpacecraft = {
    ...initialSpacecraft,
    missionElapsed: formatMET(metSeconds),
    overallHealth
  };

  // 5. Layout dragging logic (resize)
  const handleLeftMouseDown = (e) => {
    e.preventDefault();
    resizerRef.current.isDraggingLeft = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRightMouseDown = (e) => {
    e.preventDefault();
    resizerRef.current.isDraggingRight = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const drag = resizerRef.current;
    if (drag.isDraggingLeft) {
      const newWidth = Math.max(160, Math.min(450, e.clientX));
      setLeftWidth(newWidth);
    } else if (drag.isDraggingRight) {
      const windowWidth = window.innerWidth;
      const newWidth = Math.max(250, Math.min(500, windowWidth - e.clientX));
      setRightWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    const drag = resizerRef.current;
    drag.isDraggingLeft = false;
    drag.isDraggingRight = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="app">
      <TopBar spacecraft={statefulSpacecraft} />

      <div
        className="app__body"
        style={{
          '--left-width': `${leftWidth}px`,
          '--right-width': `${rightWidth}px`
        }}
      >
        <AgentRoster
          agents={initialAgents}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />

        {/* Resizer bar 1 */}
        <div className="app__resizer app__resizer--left" onMouseDown={handleLeftMouseDown} />

        <main className="app__main">
          {/* Interactive Navigation Tabs */}
          <div className="dashboard-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview Mimics
            </button>
            <button
              className={`tab-btn ${activeTab === 'telemetry' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              Telemetry & LAD Grid
            </button>
            <button
              className={`tab-btn ${activeTab === 'timeline' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Mission Plan Timeline
            </button>
            <button
              className={`tab-btn ${activeTab === 'diagnostics' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              Diagnostics Station (FDIR)
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="app__tab-content app__tab-content--overview">
              <div className="app__main-top">
                <DigitalTwinPanel spacecraft={statefulSpacecraft} channels={channels} decisions={decisions} />
                <TelemetryPanel channels={channels} />
              </div>
              <MissionTimeline
                metSeconds={metSeconds}
                decisions={decisions}
                hoveredRecId={hoveredRecId}
              />
            </div>
          )}

          {/* TAB 2: TELEMETRY GRID & PLOTS */}
          {activeTab === 'telemetry' && (
            <div className="app__tab-content app__tab-content--telemetry">
              <TelemetryTable channels={channels} metSeconds={metSeconds} />
              <TelemetryPanel channels={channels} />
            </div>
          )}

          {/* TAB 3: TIMELINE AND MISSION PLAN */}
          {activeTab === 'timeline' && (
            <div className="app__tab-content app__tab-content--timeline">
              <MissionTimeline
                metSeconds={metSeconds}
                decisions={decisions}
                hoveredRecId={hoveredRecId}
              />
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS STATION */}
          {activeTab === 'diagnostics' && (
            <div className="app__tab-content app__tab-content--diagnostics">
              <AnomalyPanel anomaly={initialAnomaly} />
              <div className="diagnostics-telemetry">
                <div className="panel-heading">
                  <span>Correlated Telemetry Channels</span>
                  <span className="panel-heading__meta">EPS-2 Anomaly Context</span>
                </div>
                <TelemetryPanel channels={channels.filter(c => c.id === 'eps2-bus-v' || c.id === 'eps2-bus-i')} />
              </div>
            </div>
          )}
        </main>

        {/* Resizer bar 2 */}
        <div className="app__resizer app__resizer--right" onMouseDown={handleRightMouseDown} />

        <RecommendationFeed
          recommendations={recs}
          decisions={decisions}
          onDecide={handleDecide}
          onHover={setHoveredRecId}
        />
      </div>

      <AuditLog entries={logs} />
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
