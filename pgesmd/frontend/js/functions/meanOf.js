/**
 * [Number] -> Number
 * 
 * Return the mean of the array.
 * @param {Array} arr The array of numbers.
 */
export default function meanOf(arr) {
  arr.reduce((acc, x) => acc + x, 0) / arr.length;
}
