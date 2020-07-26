import { range, map } from "ramda";

/**
 * Function, Number, [Any] -> [Any]
 *
 * Return the result of applying function f to the input array arr on each slice
 * of arr of size window.  (Convert a function of an array to a rolling function
 * of an array of size window.)
 * @param {Function} f A function that takes an array as input.
 * @param {Number} window The window size for the rolling calculation.
 * @param {Array} arr The input array.
 */
export function rolling(f, window, arr) {
  const _range = range(0, arr.length);
  const result = map((i) => {
    if (i + 1 < window) return "NotANumber";
    const _slice = arr.slice(i - window + 1, i + 1);
    return f(_slice);
  }, _range);
  return result;
}
