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
  range
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

const fastRollingAvg = (n, arr) => {
  const iRange = range(0, arr.length);
  let sum = 0;
  let avg = 0;

  const result = map((i) => {
    if (i - n + 1 < 0) {
      sum = sum + arr[i];
      avg = (((i + 1) / (i + 2)) * sum) / (i + 1);
      return "NotANumber";
    } else if (i - n + 1 === 0) {
      avg = avg + arr[i] / n;
      return avg;
    }
    avg = avg + (arr[i] - arr[i - n]) / n;
    return avg;
  }, iRange);

  return result;
};

const rolling = (func, n, arr) => {
    const iRange = range(0, arr.length)
    const result = map(i => {
      if (i + 1 < n) return "NotANumber"
      const truncated = slice(i - n + 1, i + 1, arr)
      return func(truncated)
    }, iRange)
    return result
  }

export const testPerformance = () => {
  const input = Array.from({ length: 2000 }, () =>
    Math.floor(Math.random() * 1000)
  );

  var t0 = performance.now();
  var result = fastRollingAvg(30, input);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = rolling(mean, 30, input);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );
};
