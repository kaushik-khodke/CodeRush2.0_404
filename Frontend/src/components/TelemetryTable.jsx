import { useState } from 'react';
import { evaluateChannelSeverity, rules } from '../lib/conditions';
import { formatMET } from '../lib/time';
import './TelemetryTable.css';

export default function TelemetryTable({ channels, metSeconds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('label');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Process rows with severity and formatted values
  const rows = channels.map((ch) => {
    const status = evaluateChannelSeverity(ch.id, ch.current);
    const rule = rules[ch.id] || { nominal: [0, 100], critical: [0, 100] };
    return {
      ...ch,
      status,
      nominalRangeText: `${rule.nominal[0]} – ${rule.nominal[1]}`,
      timestampText: formatMET(metSeconds)
    };
  });

  // Filter rows
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort rows
  const sortedRows = [...filteredRows].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Status ordinal sorting
    if (sortField === 'status') {
      const severityOrder = { NOMINAL: 0, CAUTION: 1, CRITICAL: 2 };
      valA = severityOrder[a.status];
      valB = severityOrder[b.status];
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIndicator = (field) => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  const trendGlyph = { rising: '↗', falling: '↘', stable: '→' };

  return (
    <section className="telemetry-table">
      <div className="panel-heading">
        <span>Telemetry Table (LAD Table)</span>
        <span className="panel-heading__meta">{sortedRows.length} channels showing</span>
      </div>

      <div className="telemetry-table__controls">
        <input
          type="text"
          className="telemetry-table__search"
          placeholder="Filter channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="telemetry-table__filter-buttons">
          {['ALL', 'NOMINAL', 'CAUTION', 'CRITICAL'].map((status) => (
            <button
              key={status}
              className={`telemetry-table__filter-btn ${
                statusFilter === status ? 'telemetry-table__filter-btn--active' : ''
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="telemetry-table__wrapper">
        <table className="telemetry-table__table">
          <thead>
            <tr>
              <th onClick={() => handleSort('label')}>
                Channel {getSortIndicator('label')}
              </th>
              <th onClick={() => handleSort('current')} style={{ textAlign: 'right' }}>
                Value {getSortIndicator('current')}
              </th>
              <th>Nominal Limits</th>
              <th onClick={() => handleSort('status')}>
                Status {getSortIndicator('status')}
              </th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="telemetry-table__empty">
                  No telemetry channels matching criteria.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const statusColor =
                  row.status === 'CRITICAL'
                    ? 'var(--accent-red)'
                    : row.status === 'CAUTION'
                    ? 'var(--accent-amber)'
                    : 'var(--accent-cyan)';
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="telemetry-table__ch-name">{row.label}</div>
                      <div className="telemetry-table__ch-id">{row.id}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <span className="telemetry-table__trend" data-trend={row.trend}>
                        {trendGlyph[row.trend]}
                      </span>{' '}
                      <span style={{ color: statusColor, fontWeight: 'bold' }}>
                        {row.current.toFixed(2)}
                      </span>
                      <span className="telemetry-table__unit">{row.unit}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {row.nominalRangeText}
                    </td>
                    <td>
                      <span
                        className="telemetry-table__status-badge"
                        style={{
                          borderColor: statusColor,
                          color: statusColor,
                          background: `rgba(${
                            row.status === 'CRITICAL'
                              ? '239, 83, 80'
                              : row.status === 'CAUTION'
                              ? '240, 168, 59'
                              : '79, 216, 200'
                          }, 0.08)`
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {row.timestampText}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
