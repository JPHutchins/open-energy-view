import { meanOf } from "./meanOf";

/**
 * [Number] -> Number
 *
 * Return the standard deviation of the array.
 * @param {Array} arr The array of numbers.
 * @param {Number} _mean Optional mean, if already calculated.
 */
export function standardDeviationOf(arr, _mean = null) {
  _mean = _mean ? _mean : meanOf(arr);
  const _variances = arr.map((x) => (x - _mean) * (x - _mean));
  return Math.sqrt(meanOf(_variances));
}
