import { useState } from 'react';
import { evaluateChannelSeverity } from '../lib/conditions';
import Scene from './twin3d/Scene.jsx';
import StatusBadge from './StatusBadge.jsx';
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
          <Scene
            selectedSubsystem={selectedSubsystem}
            setSelectedSubsystem={setSelectedSubsystem}
            panelBStatus={panelBStatus}
            batteryStatus={batteryStatus}
          />
        </div>

        {/* Dynamic Interactive Callout Panel */}
        <div className="twin__info-panel" style={{ borderLeftColor: activeSub.color }}>
          <div className="twin__info-header">
            <span className="twin__info-name">{activeSub.name}</span>
            <StatusBadge status={activeSub.status} />
          </div>
          <div className="twin__info-telemetry">{activeSub.telemetry}</div>
          <div className="twin__info-desc">{activeSub.description}</div>
        </div>
      </div>
    </section>
  );
}
