import {
  compose,
  map,
  join,
  chian,
  ap,
  indexOf,
  lift,
  either,
  isNil,
  slice,
  mean,
} from "ramda";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import moment from "moment";

// minZero :: Number -> Number
export const minZero = (x) => Math.max(0, x);

// makeIntervalBounds :: String -> Moment -> {k: v}
export const makeIntervalBounds = (intervalType) => (start, end = null) => {
  if (end) return { start: start, end: end };
  return {
    start: moment(start.startOf(intervalType)),
    end: moment(start.endOf(intervalType)),
  };
};

// dayBounds :: Moment -> {k: v}
export const dayBounds = makeIntervalBounds("day");

// minOf :: [Number] -> Number
export const minOf = (A) => A.reduce((acc, x) => Math.min(acc, x), Infinity);

// meanOf :: [Number] -> Number
export const meanOf = (A) => A.reduce((acc, x) => acc + x, 0) / A.length;

export const standardDeviationOf = (A) => {
  const _mean = meanOf(A);
  const _deviations = A.map((x) => (x - _mean) * (x - _mean));
  return Math.sqrt(meanOf(_deviations));
};

const test = [2, 4, 6, 8, 10, 12];
console.log(standardDeviationOf(test));

const rolling = (n, arr) => {
  const iRange = range(0, arr.length);
  let sum = 0;
  let avg = 0;

  const result = map((i) => {
    if (i - n + 1 < 0) {
      sum = sum + arr[i];
      avg = (((i + 1) / (i + 2)) * sum) / (i + 1);
      return "nan";
    } else if (i - n + 1 === 0) {
      avg = avg + arr[i] / n;
      return avg;
    }
    avg = avg + (arr[i] - arr[i - n]) / n;
    return avg;
  }, iRange);
  return result;
};
