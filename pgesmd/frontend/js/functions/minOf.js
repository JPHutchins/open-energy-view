/**
 * [Number] -> Number
 * 
 * Return the minimum number of the array.
 * @param {Array} arr The array of numbers.
 */
export function minOf(arr) {
  arr.reduce((acc, x) => Math.min(acc, x), Infinity);
}
