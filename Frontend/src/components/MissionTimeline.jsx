import { formatMET, BASE_MET_SECONDS } from '../lib/time';
import './MissionTimeline.css';

export default function MissionTimeline({ metSeconds, decisions, hoveredRecId }) {
  // We show a 6-hour window centered roughly around base MET
  // From 2 hours before base MET to 4 hours after
  const timeWindow = 6 * 3600; // 6 hours in seconds
  const startTime = BASE_MET_SECONDS - 2 * 3600;
  const endTime = startTime + timeWindow;

  // Check if REC-120 (Safe-mode / Abort Science) is hovered or approved
  const isRec120Active = hoveredRecId === 'REC-120' || decisions['REC-120'] === 'approved';
  // Check if REC-118 (Load-shed) is hovered or approved
  const isRec118Active = hoveredRecId === 'REC-118' || decisions['REC-118'] === 'approved';
  // Check if REC-119 (EPS-1 reconfiguration) is hovered or approved
  const isRec119Active = hoveredRecId === 'REC-119' || decisions['REC-119'] === 'approved';

  // Base activities in our plan
  const activities = [
    {
      id: 'sci-1',
      name: 'Lunar South Pole Survey',
      category: 'science',
      start: BASE_MET_SECONDS - 1 * 3600,
      end: BASE_MET_SECONDS + 1.2 * 3600,
      status: isRec120Active ? 'ABORTED' : 'PRESERVED',
      note: isRec120Active ? 'Aborted by Safe-Mode Action' : 'Active - Nominal'
    },
    {
      id: 'sci-2',
      name: 'Far-Side Radio Astronomy',
      category: 'science',
      start: BASE_MET_SECONDS + 2 * 3600,
      end: BASE_MET_SECONDS + 3.8 * 3600,
      status: 'PRESERVED',
      note: 'Scheduled'
    },
    {
      id: 'comm-1',
      name: 'DSN Goldstone Uplink',
      category: 'comms',
      start: BASE_MET_SECONDS - 1.8 * 3600,
      end: BASE_MET_SECONDS + 0.5 * 3600,
      status: 'PRESERVED',
      note: 'Active - Comms Lock'
    },
    {
      id: 'comm-2',
      name: 'DSN Canberra Uplink',
      category: 'comms',
      start: BASE_MET_SECONDS + 2.5 * 3600,
      end: BASE_MET_SECONDS + 3.9 * 3600,
      status: 'PRESERVED',
      note: 'Scheduled'
    }
  ];

  // Dynamic proposed activities based on recommendations
  const proposedActivities = [];
  if (isRec118Active) {
    proposedActivities.push({
      id: 'prop-118',
      name: 'REC-118: Load Shed (Non-Essential Heaters)',
      category: 'maneuvers',
      start: BASE_MET_SECONDS + 0.1 * 3600,
      end: BASE_MET_SECONDS + 1.5 * 3600,
      status: 'PROPOSED',
      note: 'Saves 35W EPS-2 load'
    });
  }
  if (isRec119Active) {
    proposedActivities.push({
      id: 'prop-119',
      name: 'REC-119: EPS Redundancy Handover',
      category: 'maneuvers',
      start: BASE_MET_SECONDS + 0.2 * 3600,
      end: BASE_MET_SECONDS + 0.8 * 3600,
      status: 'PROPOSED',
      note: 'EPS-2 -> EPS-1 redundant bus'
    });
  }

  const allActivities = [...activities, ...proposedActivities];

  // Helper to calculate percentage offset
  const getPct = (time) => {
    const pct = ((time - startTime) / timeWindow) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const playheadPct = getPct(metSeconds);

  // Time grid markers (every 1 hour)
  const ticks = [];
  for (let t = startTime; t <= endTime; t += 3600) {
    ticks.push(t);
  }

  const renderSwimlane = (category, title) => {
    const laneActs = allActivities.filter((a) => a.category === category);
    return (
      <div className="timeline__lane" key={category}>
        <div className="timeline__lane-header">{title}</div>
        <div className="timeline__lane-content">
          {laneActs.map((act) => {
            const left = getPct(act.start);
            const right = getPct(act.end);
            const width = right - left;

            let statusClass = 'timeline__act--preserved';
            if (act.status === 'ABORTED') statusClass = 'timeline__act--aborted';
            if (act.status === 'PROPOSED') statusClass = 'timeline__act--proposed';

            return (
              <div
                key={act.id}
                className={`timeline__act ${statusClass}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
                title={`${act.name} (${act.note})`}
              >
                <div className="timeline__act-label">{act.name}</div>
                <div className="timeline__act-sub">{act.note}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="timeline-panel">
      <div className="panel-heading">
        <span>Mission Timeline (Plan Execution)</span>
        <span className="panel-heading__meta">Playhead synchronized with MET clock</span>
      </div>

      <div className="timeline__container">
        {/* Time Axis Ticks */}
        <div className="timeline__axis">
          <div className="timeline__lane-header" style={{ borderBottom: 'none' }} />
          <div className="timeline__axis-ticks">
            {ticks.map((t, idx) => {
              const left = getPct(t);
              const metParts = formatMET(t).split(' ');
              const timeStr = `${metParts[1]} ${metParts[2]}`; // HHh MMm
              return (
                <div key={idx} className="timeline__tick-wrapper" style={{ left: `${left}%` }}>
                  <div className="timeline__tick-line" />
                  <span className="timeline__tick-label">{timeStr}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lanes */}
        {renderSwimlane('science', 'Science Ops')}
        {renderSwimlane('comms', 'DSN Communications')}
        {renderSwimlane('maneuvers', 'Proposed Actions')}

        {/* Current Time Playhead */}
        {playheadPct >= 0 && playheadPct <= 100 && (
          <div className="timeline__playhead" style={{ left: `calc(${playheadPct}% + 130px)` }}>
            <div className="timeline__playhead-label">MET</div>
            <div className="timeline__playhead-line" />
          </div>
        )}
      </div>
    </section>
  );
}
