import { chain } from "ramda";
import { Either } from "ramda-fantasy";
import { makeFillWindow } from "./makeFillWindow";
import { fastRollingMean } from "./fastRollingMean";
import { rolling } from "./rolling";
import { zip3 } from "./zip3";

/**
 * Number -> ( [Number] -> [Number] )
 * 
 * Replace data points that are outside one standard deviation from their mean
 * with the mean.  The beginning of the array gets filled with the first mean
 * from the rolling window and the end of the array is filled by shrinking the
 * window.
 * @param {Number} window The window size for the rolling mean and rolling
 * standard deviation calculations.
 * @param {Array} arr The input array.
 */
export function removeOutliers(window) {
    // Refactor to NOT return a Right but do return a Left on any error
  return function (arr) {
    const fillWindow = makeFillWindow(window)(arr);

    const _rMeanRaw = fastRollingMean(window)(arr);
    const _rMeanEither = chain(fillWindow(meanOf), _rMeanRaw);
    if (_rMeanEither.isLeft) return Either.Left(arr);
    const _rMean = _rMeanEither.value;

    const _rStdRaw = rolling(standardDeviationOf, window, arr);
    const _rStdEither = fillWindow(standardDeviationOf)(_rStdRaw);
    if (_rStdEither.isLeft) return Either.Left(arr);
    const _rStd = _rStdEither.value;

    if (arr.length != _rMean.length && arr.length != _rStd.length) {
      return Either.Left(arr);
    }

    const _zipped = zip3(arr, _rMean, _rStd).map((x) => ({
      arr: x[0],
      mean: x[1],
      std: x[2],
    }));
    const output = _zipped.map((x) =>
      x.arr < x.mean - x.std || x.arr > x.mean + x.std ? x.mean : x.arr
    );

    return Either.Right(output);
  };
}
