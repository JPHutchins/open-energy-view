/**
 * Number -> String
 *
 * Return the maximum resolution of intervals given a window size allowing a
 * resolution no greater than 52 intervals per window.
 * @param {Number} windowSize The window size in milliseconds.
 */
export function findMaxResolution(windowSize) {
  const _dataPointLength = Math.abs(windowSize) / 52;
  if (_dataPointLength >= 609785000) return "month";
  if (_dataPointLength >= 52538461) return "week";
  if (_dataPointLength >= 11700000) return "day";
  if (_dataPointLength >= 1661538 + 1) return "part";
  return "hour";
}
