/**
 * [Number] -> Number
 *
 * Return the maximum number of the array.
 * @param {Array} arr The array of numbers.
 */
export function maxOf(arr) {
  return arr.reduce((acc, x) => Math.max(acc, x), -Infinity);
}
