import { addIndex, map, range } from "ramda";
import { Either } from "ramda-fantasy";

/**
 * Fill in the edges of the array left empty by the rolling calculations.
 *
 * @param {Number} window
 */
export const makeFillWindow = (window) => (originalArr) => (f) => (arr) => {
  const output = centerOffset(window, arr);
  return fillEndOfArray(window, originalArr, f, arr, output);
};

/**
 * Remove the offset caused by a rolling operation from the dataset.
 *
 * Given a window size, window, that was used to generate a rolling operation on
 * an array and the array, arr, resulting from that rolling operation, shift the
 * contents of the array "left" by one half the window size and slice the array
 * at that point.
 *
 * @param {Number} window
 * @param {Array} arr
 */
function centerOffset(window, arr) {
  const middle = Math.floor(window / 2);
  const output = addIndex(map)(
    (x, i) => (i < window ? arr[window] : x),
    arr
  ).slice(middle);
  return output;
}

/**
 * Fill the last (window / 2) values of the array with the results of applying
 * the function, f, to a shrinking window size.
 * 
 * @param {Number} window 
 * @param {Array} originalArr 
 * @param {Function} f 
 * @param {Array} arr 
 * @param {Array} output 
 */
function fillEndOfArray(window, originalArr, f, arr, output) {
    const length = arr.length;
    const middle = Math.floor(window / 2);
  
    const remainingWindow = length - output.length;
    const windowRange = range(1, remainingWindow + 1).reverse();
  
    for (let rWindow of windowRange) {
      const newWindow = originalArr.slice(length - rWindow - middle);
      output.push(f(newWindow));
    }
    return Either.Right(output);
  }
