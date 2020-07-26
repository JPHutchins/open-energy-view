/**
 * [Number] -> Number
 *
 * Return the mean of the array.
 * @param {Array} arr The array of numbers.
 */
export function meanOf(arr) {
  // rough support for ImmutablJS List:
  const length = arr.length ? arr.length : arr.size
  
  return arr.reduce((acc, x) => acc + x, 0) / length;
}
