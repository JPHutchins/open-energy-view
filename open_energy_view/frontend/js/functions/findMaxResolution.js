/**
 * Number -> String
 *
 * Return the maximum resolution of intervals given a window size allowing a
 * resolution no greater than 52 intervals per window.
 * @param {Number} windowSize The window size in milliseconds.
 */
export function findMaxResolution(windowSize) {
  const _dataPointLength = Math.abs(windowSize) / 52;
  if (_dataPointLength >= 3600 * 24 * 728 * 1000 / 52) return "month";
  if (_dataPointLength >= 299076923) return "week";
  if (_dataPointLength >= 46523076) return "day";
  if (_dataPointLength >= 11298461) return "part";
  return "hour";
}
