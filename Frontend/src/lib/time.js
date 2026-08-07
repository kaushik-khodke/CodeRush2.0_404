const BASE_MET_SECONDS = (((412 * 24) + 6) * 60 + 12) * 60; // 412d 06h 12m 00s in seconds

/**
 * Formats a duration in seconds into a standard space-comms MET string: DDDd HHh MMm SSs
 * @param {number} totalSeconds - Total elapsed seconds
 * @returns {string} Formatted MET string
 */
export function formatMET(totalSeconds) {
  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_DAY = 86400;

  const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
  let remainder = totalSeconds % SECONDS_IN_DAY;

  const hours = Math.floor(remainder / SECONDS_IN_HOUR);
  remainder %= SECONDS_IN_HOUR;

  const minutes = Math.floor(remainder / SECONDS_IN_MINUTE);
  const seconds = remainder % SECONDS_IN_MINUTE;

  const pad = (num) => String(num).padStart(2, '0');

  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export { BASE_MET_SECONDS };
