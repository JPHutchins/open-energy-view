import { Either } from "ramda-fantasy";
import { range, map } from "ramda";

/**
 * Number -> ( [Number] -> [Number] )
 *
 * Return the rolling mean of the array given a window size.
 * @param {Number} window The window size for the rolling mean.
 * @param {Array} arr The input array.
 */
export function fastRollingMean(window) {
  // Re factor to not wrap output in Either - but should return Left if fail.
  return function (arr) {
    const _range = range(0, arr.length);
    let _sum = 0;
    let _avg = 0;

    const result = map((i) => {
      if (i - window + 1 < 0) {
        _sum = _sum + arr[i];
        _avg = _sum / (i + 2);
        return "NotANumber";
      } else if (i - window + 1 === 0) {
        _avg = _avg + arr[i] / window;
        return _avg;
      }
      _avg = _avg + (arr[i] - arr[i - window]) / window;
      return _avg;
    }, _range);

    return Either.Right(result);
  };
}
