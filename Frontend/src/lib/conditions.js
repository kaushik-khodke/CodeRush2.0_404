// Telemetry threshold rules mapping.
// Nominal defines the normal operating bounds.
// Critical defines bounds beyond which a parameter is in an emergency state.
// Values outside nominal but inside critical are categorized as CAUTION.
export const rules = {
  'eps2-bus-v': {
    nominal: [27.6, 28.4],
    critical: [25.5, 29.5]
  },
  'eps2-bus-i': {
    nominal: [4.0, 6.5],
    critical: [2.0, 8.0]
  },
  'batt-temp': {
    nominal: [5.0, 25.0],
    critical: [0.0, 35.0]
  },
  'star-tracker': {
    nominal: [98.0, 100.0],
    critical: [95.0, 100.0]
  }
};

/**
 * Evaluates the status of a telemetry channel based on its current value.
 * @param {string} channelId - The telemetry channel ID
 * @param {number} value - The current value of the telemetry channel
 * @returns {'NOMINAL' | 'CAUTION' | 'CRITICAL'} The derived severity status
 */
export function evaluateChannelSeverity(channelId, value) {
  const channelRule = rules[channelId];
  if (!channelRule) return 'NOMINAL';

  const { nominal, critical } = channelRule;

  // Check CRITICAL first
  if (value < critical[0] || value > critical[1]) {
    return 'CRITICAL';
  }

  // Check NOMINAL next
  if (value >= nominal[0] && value <= nominal[1]) {
    return 'NOMINAL';
  }

  // If not nominal and not critical, it's CAUTION
  return 'CAUTION';
}
