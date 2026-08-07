import { useState } from 'react';
import { evaluateChannelSeverity } from '../lib/conditions';
import './DigitalTwinPanel.css';

export default function DigitalTwinPanel({ spacecraft, channels, decisions }) {
  const [selectedSubsystem, setSelectedSubsystem] = useState('panelB');

  // Check if EPS issues are resolved by active operator decisions
  const isEPSResolved =
    decisions['REC-118']?.type === 'approved' ||
    decisions['REC-119']?.type === 'approved' ||
    decisions['REC-120']?.type === 'approved';

  // Get dynamic telemetry values
  const getChannel = (id) => channels.find((c) => c.id === id) || { current: 0, unit: '', status: 'NOMINAL' };
  
  const vChannel = getChannel('eps2-bus-v');
  const iChannel = getChannel('eps2-bus-i');
  const tempChannel = getChannel('batt-temp');
  const trackerChannel = getChannel('star-tracker');

  // Determine subsystem statuses
  const panelBStatus = isEPSResolved ? 'NOMINAL' : 'CAUTION';
  const batteryStatus = tempChannel.status; // Derived from battery temp rules

  // Subsystem descriptions
  const subsystems = {
    panelA: {
      name: 'Solar Array Panel A',
      status: 'NOMINAL',
      telemetry: 'Tracking: AUTO | Lock: 100% | Bus: EPS-1',
      description: 'Primary solar array string 1 & 2. Operating under nominal attitude guidelines.',
      color: 'var(--accent-green)'
    },
    panelB: {
      name: 'Solar Array Panel B',
      status: panelBStatus,
      telemetry: `Voltage: ${vChannel.current.toFixed(1)}${vChannel.unit} | Current: ${iChannel.current.toFixed(1)}${iChannel.unit}`,
      description: isEPSResolved 
        ? 'Mitigation action active. EPS load-shed or bus reconfigured. Voltage stabilized.' 
        : 'Sub-string 3 shows 9% output degradation. EPS-2 compensating with higher current draw.',
      color: panelBStatus === 'NOMINAL' ? 'var(--accent-cyan)' : 'var(--accent-amber)'
    },
    antenna: {
      name: 'High Gain Comms Antenna',
      status: 'NOMINAL',
      telemetry: `RF Lock: ${trackerChannel.current.toFixed(1)}${trackerChannel.unit} (S-Band)`,
      description: 'Active downlink link established with Goldstone Deep Space Network. Star tracker alignment locked.',
      color: 'var(--accent-violet)'
    },
    battery: {
      name: 'EPS-2 Battery Pack',
      status: batteryStatus,
      telemetry: `Temp: ${tempChannel.current.toFixed(1)}${tempChannel.unit} | State: ${batteryStatus === 'NOMINAL' ? 'Nominal' : 'Over Limit'}`,
      description: batteryStatus === 'NOMINAL'
        ? 'Secondary Lithium-Ion energy reservoir. Solid state charging cycle.'
        : 'Warning: Battery pack temperature has exceeded caution limits. Thermal control active.',
      color: batteryStatus === 'NOMINAL' ? 'var(--accent-green)' : 'var(--accent-amber)'
    }
  };

  const activeSub = subsystems[selectedSubsystem];

  return (
    <section className="twin">
      <div className="panel-heading">
        <span>Digital Twin Mimic (Interactive)</span>
        <span className="panel-heading__meta">Click subsystems to inspect</span>
      </div>

      <div className="twin__layout">
        <div className="twin__stage">
          <svg viewBox="0 0 260 200" className="twin__svg">
            {/* orbit path */}
            <ellipse
              cx="130"
              cy="100"
              rx="110"
              ry="34"
              fill="none"
              stroke="var(--line)"
              strokeDasharray="2 5"
            />
            
            {/* bus body / chassis */}
            <rect 
              x="108" 
              y="86" 
              width="44" 
              height="28" 
              rx="3" 
              fill={selectedSubsystem === 'battery' ? 'rgba(87, 198, 122, 0.1)' : 'var(--bg-panel-raised)'} 
              stroke={selectedSubsystem === 'battery' ? 'var(--accent-green)' : 'var(--line-bright)'} 
              strokeWidth={selectedSubsystem === 'battery' ? '2' : '1.2'} 
              className="twin__interactive-path"
              onClick={() => setSelectedSubsystem('battery')}
            />
            {/* battery indicator nested in bus */}
            <rect 
              x="116" 
              y="94" 
              width="28" 
              height="12" 
              rx="1" 
              fill="rgba(0,0,0,0.2)" 
              stroke={batteryStatus === 'NOMINAL' ? 'var(--accent-green)' : 'var(--accent-amber)'} 
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedSubsystem('battery')}
            />

            {/* solar panel A - nominal */}
            <rect 
              x="30" 
              y="94" 
              width="70" 
              height="12" 
              fill="rgba(87, 198, 122, 0.1)" 
              stroke={selectedSubsystem === 'panelA' ? 'var(--accent-green)' : 'rgba(87, 198, 122, 0.6)'} 
              strokeWidth={selectedSubsystem === 'panelA' ? '2' : '1'} 
              className="twin__interactive-path"
              onClick={() => setSelectedSubsystem('panelA')}
            />

            {/* solar panel B - degraded/flagged */}
            <rect 
              x="160" 
              y="94" 
              width="70" 
              height="12" 
              fill={panelBStatus === 'NOMINAL' ? 'rgba(79, 216, 200, 0.1)' : 'rgba(240, 168, 59, 0.1)'} 
              stroke={selectedSubsystem === 'panelB' ? activeSub.color : panelBStatus === 'NOMINAL' ? 'rgba(79, 216, 200, 0.6)' : 'rgba(240, 168, 59, 0.6)'} 
              strokeWidth={selectedSubsystem === 'panelB' ? '2' : '1'} 
              className="twin__interactive-path"
              onClick={() => setSelectedSubsystem('panelB')}
            />
            
            {/* Flagged segment overlay on panel B if not resolved */}
            {!isEPSResolved && (
              <rect 
                x="160" 
                y="94" 
                width="23" 
                height="12" 
                fill="rgba(240, 168, 59, 0.35)" 
                stroke="var(--accent-amber)" 
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSubsystem('panelB')}
              />
            )}

            {/* comms dish */}
            <circle 
              cx="130" 
              cy="76" 
              r="7" 
              fill="none" 
              stroke={selectedSubsystem === 'antenna' ? 'var(--accent-violet)' : 'rgba(139, 143, 255, 0.6)'} 
              strokeWidth={selectedSubsystem === 'antenna' ? '2' : '1.2'} 
              className="twin__interactive-path"
              onClick={() => setSelectedSubsystem('antenna')}
            />
            <line 
              x1="130" 
              y1="83" 
              x2="130" 
              y2="86" 
              stroke={selectedSubsystem === 'antenna' ? 'var(--accent-violet)' : 'rgba(139, 143, 255, 0.6)'} 
              strokeWidth="1.2" 
            />

            {/* Active flashing warning dot on Panel B if not resolved */}
            {!isEPSResolved && (
              <circle cx="172" cy="100" r="4" fill="var(--accent-amber)" style={{ pointerEvents: 'none' }}>
                <animate attributeName="opacity" values="1;0.25;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            
            {/* Battery Warning flashing dot if battery is hot */}
            {batteryStatus === 'CAUTION' && (
              <circle cx="130" cy="100" r="4" fill="var(--accent-amber)" style={{ pointerEvents: 'none' }}>
                <animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>
        </div>

        {/* Dynamic Interactive Callout Panel */}
        <div className="twin__info-panel" style={{ borderLeftColor: activeSub.color }}>
          <div className="twin__info-header">
            <span className="twin__info-name">{activeSub.name}</span>
            <span
              className="twin__info-badge"
              style={{
                borderColor: activeSub.color,
                color: activeSub.color,
                background: `rgba(${
                  activeSub.status === 'CRITICAL'
                    ? '239, 83, 80'
                    : activeSub.status === 'CAUTION'
                    ? '240, 168, 59'
                    : '87, 198, 122'
                }, 0.08)`
              }}
            >
              {activeSub.status}
            </span>
          </div>
          <div className="twin__info-telemetry">{activeSub.telemetry}</div>
          <div className="twin__info-desc">{activeSub.description}</div>
        </div>
      </div>
    </section>
  );
}
