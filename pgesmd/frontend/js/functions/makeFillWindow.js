import { addIndex, map, range } from "ramda";
import { Either } from "ramda-fantasy";

/**
 * Fill in the edges of the array left empty by the rolling calculations.
 *
 * @param {Number} window
 */
export const makeFillWindow = (window) => (originalArr) => (f) => (arr) => {
  // Re factor into multiple functions and compose.
  const length = arr.length;
  const middle = Math.floor(window / 2);
  const output = addIndex(map)(
    (x, i) => (i < window ? arr[window] : x),
    arr
  ).slice(middle);

  const remainingWindow = length - output.length;
  const windowRange = range(1, remainingWindow + 1).reverse();
  for (let rWindow of windowRange) {
    output.push(f(originalArr.slice(length - rWindow - middle)));
  }
  return Either.Right(output);
};
