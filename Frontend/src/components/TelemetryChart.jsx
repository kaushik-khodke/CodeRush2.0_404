import { useState, useRef } from 'react';
import { evaluateChannelSeverity, rules } from '../lib/conditions';

export default function TelemetryChart({ channelId, label, series, current, unit }) {
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [panOffset, setPanOffset] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const containerRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startOffset: 0 });

  // Resolve rules from conditions engine
  const rule = rules[channelId] || { nominal: [0, 100], critical: [0, 100] };
  const nominal = rule.nominal;
  const critical = rule.critical;

  // Dimensions
  const width = 320;
  const height = 130;
  const padding = { top: 12, right: 12, bottom: 20, left: 35 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // X range mapping based on zoom and pan
  const defaultVisibleCount = 30;
  const visibleCount = Math.max(5, Math.min(series.length, Math.round(defaultVisibleCount * zoomFactor)));
  
  // Calculate indices
  const maxPanOffset = Math.max(0, series.length - visibleCount);
  const currentPanOffset = Math.min(panOffset, maxPanOffset);
  
  const endIndex = series.length - 1 - currentPanOffset;
  const startIndex = Math.max(0, endIndex - visibleCount);
  const visibleSeries = series.slice(startIndex, endIndex + 1);

  // Y range mapping based on critical limits
  const rangeSpan = critical[1] - critical[0] || 1;
  const yMin = critical[0] - rangeSpan * 0.15;
  const yMax = critical[1] + rangeSpan * 0.15;

  const getX = (index) => {
    if (visibleSeries.length <= 1) return padding.left;
    return padding.left + (index / (visibleSeries.length - 1)) * plotWidth;
  };

  const getY = (val) => {
    const pct = (val - yMin) / (yMax - yMin);
    return padding.top + plotHeight - pct * plotHeight;
  };

  // Build points string
  const points = visibleSeries
    .map((v, i) => `${getX(i)},${getY(v)}`)
    .join(' ');

  // Get status color
  const status = evaluateChannelSeverity(channelId, current);
  const statusColor =
    status === 'CRITICAL'
      ? 'var(--accent-red)'
      : status === 'CAUTION'
      ? 'var(--accent-amber)'
      : 'var(--accent-cyan)';

  // Interaction handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    setZoomFactor((prev) => Math.max(0.2, Math.min(4.0, prev * factor)));
  };

  const handleMouseDown = (e) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startOffset: panOffset
    };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    const drag = dragRef.current;
    
    // Tooltip evaluation
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const plotMouseX = mouseX - padding.left;
    
    if (plotMouseX >= 0 && plotMouseX <= plotWidth && visibleSeries.length > 0) {
      const pct = plotMouseX / plotWidth;
      const index = Math.round(pct * (visibleSeries.length - 1));
      const val = visibleSeries[index];
      const timeSecs = startIndex + index; // Relative simulated seconds
      
      setHoveredPoint({
        x: getX(index),
        y: getY(val),
        value: val,
        timeSecs
      });
    } else {
      setHoveredPoint(null);
    }

    // Drag handling
    if (!drag.isDragging) return;
    const deltaX = e.clientX - drag.startX;
    // Drag left means go forward in history (increase offset), drag right means go back (decrease offset)
    const pointsPerPixel = visibleCount / plotWidth;
    const deltaPoints = Math.round(-deltaX * pointsPerPixel);
    const newOffset = Math.max(0, Math.min(series.length - visibleCount, drag.startOffset + deltaPoints));
    setPanOffset(newOffset);
  };

  const handleMouseUp = (e) => {
    dragRef.current.isDragging = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleDoubleClick = () => {
    setZoomFactor(1.0);
    setPanOffset(0);
  };

  // Render Limit bands
  const nominalTop = getY(nominal[1]);
  const nominalBottom = getY(nominal[0]);
  const criticalTop = getY(critical[1]);
  const criticalBottom = getY(critical[0]);

  return (
    <div className="telemetry__card" ref={containerRef} style={{ userSelect: 'none' }}>
      <div className="telemetry__card-top">
        <span className="telemetry__label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentPanOffset > 0 && (
            <span
              className="telemetry__badge"
              style={{
                background: 'rgba(240, 168, 59, 0.15)',
                color: 'var(--accent-amber)',
                fontSize: '10px',
                padding: '1px 4px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
              onClick={() => setPanOffset(0)}
              title="Click to resume live feed"
            >
              PAUSED
            </span>
          )}
          <span className="telemetry__status-text" style={{ color: statusColor, fontSize: '11px', fontWeight: 'bold' }}>
            {status}
          </span>
        </div>
      </div>

      <div className="telemetry__value-row">
        <span className="telemetry__value" style={{ color: statusColor }}>
          {current.toFixed(1)}
          <span className="telemetry__unit">{unit}</span>
        </span>
        <span className="telemetry__nominal" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
          nom {nominal[0]}–{nominal[1]}
        </span>
      </div>

      <div
        className="telemetry__chart-container"
        style={{ cursor: 'grab', position: 'relative' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
          {/* Grid lines */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="var(--line)" strokeWidth="0.5" />
          <line x1={padding.left} y1={padding.top + plotHeight / 2} x2={width - padding.right} y2={padding.top + plotHeight / 2} stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1={padding.left} y1={padding.top + plotHeight} x2={width - padding.right} y2={padding.top + plotHeight} stroke="var(--line)" strokeWidth="0.5" />

          {/* Nominal Limit Shaded Band */}
          <rect
            x={padding.left}
            y={nominalTop}
            width={plotWidth}
            height={Math.max(0, nominalBottom - nominalTop)}
            fill="rgba(87, 198, 122, 0.04)"
          />

          {/* Nominal Limits (dashed green) */}
          <line x1={padding.left} y1={nominalTop} x2={width - padding.right} y2={nominalTop} stroke="rgba(87, 198, 122, 0.3)" strokeDasharray="3,3" />
          <line x1={padding.left} y1={nominalBottom} x2={width - padding.right} y2={nominalBottom} stroke="rgba(87, 198, 122, 0.3)" strokeDasharray="3,3" />

          {/* Critical Limits (dashed red) */}
          <line x1={padding.left} y1={criticalTop} x2={width - padding.right} y2={criticalTop} stroke="rgba(239, 83, 80, 0.3)" strokeDasharray="4,4" />
          <line x1={padding.left} y1={criticalBottom} x2={width - padding.right} y2={criticalBottom} stroke="rgba(239, 83, 80, 0.3)" strokeDasharray="4,4" />

          {/* Y Axis Text Labels */}
          <text x={padding.left - 6} y={getY(nominal[1]) + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-mono)">
            {nominal[1]}
          </text>
          <text x={padding.left - 6} y={getY(nominal[0]) + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-mono)">
            {nominal[0]}
          </text>

          {/* Plot Data Line */}
          {points && (
            <polyline
              points={points}
              fill="none"
              stroke={statusColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Live indicator dot (only at live edge) */}
          {currentPanOffset === 0 && visibleSeries.length > 0 && (
            <circle
              cx={getX(visibleSeries.length - 1)}
              cy={getY(current)}
              r="3.5"
              fill={statusColor}
            />
          )}

          {/* Hover Crosshair / Tooltip */}
          {hoveredPoint && (
            <>
              {/* Vertical tracking line */}
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + plotHeight}
                stroke="rgba(231, 237, 243, 0.2)"
                strokeDasharray="2,2"
              />
              {/* Hover dot */}
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="var(--text-primary)" stroke={statusColor} strokeWidth="1" />
              {/* Tooltip value */}
              <rect
                x={hoveredPoint.x + 8 + 65 > width - padding.right ? hoveredPoint.x - 70 : hoveredPoint.x + 8}
                y={hoveredPoint.y - 12}
                width="62"
                height="16"
                rx="2"
                fill="var(--bg-panel-raised)"
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text
                x={hoveredPoint.x + 8 + 65 > width - padding.right ? hoveredPoint.x - 39 : hoveredPoint.x + 39}
                y={hoveredPoint.y}
                fill="var(--text-primary)"
                fontSize="9"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {hoveredPoint.value.toFixed(1)} {unit}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
