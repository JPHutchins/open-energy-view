import {
  curry,
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
  range,
  isEmpty,
  prepend,
  drop,
  head,
} from "ramda";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import moment from "moment";
const { Map, List, first } = require("immutable");

// minZero :: Number -> Number
export const minZero = (x) => Math.max(0, x);

// makeIntervalBounds :: String -> Moment -> {k: v}
export const makeIntervalBounds = (intervalType) => (start, end = null) => {
  if (end) return { start: start, end: end };
  return {
    start: moment(moment(start).startOf(intervalType)),
    end: moment(moment(start).endOf(intervalType)),
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

const EnergyHistory = (data) => ({
  map: (x) => x.map((x) => x.get("y")),
});

const indexOfTime = (database) => (time) => {
  let l = 0;
  let r = database.size - 1;
  let m = 0;

  while (l <= r) {
    m = Math.floor((l + r) / 2);
    const _current = database.get(m).get("x");
    if (time === _current) return m;
    time < _current ? (r = m - 1) : (l = m + 1);
  }
  return m + 1; //If not found return index for "insert"
};

const fastRollingMean = (n, arr) => {
  const iRange = range(0, arr.length);
  let sum = 0;
  let avg = 0;

  const result = map((i) => {
    if (i - n + 1 < 0) {
      sum = sum + arr[i];
      avg = sum / (i + 2);
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
  const iRange = range(0, arr.length);
  const result = map((i) => {
    if (i + 1 < n) return "NotANumber";
    const truncated = slice(i - n + 1, i + 1, arr);
    return func(truncated);
  }, iRange);
  return result;
};

const getPlainList = (list) => {
  return list.map((x) => ({ x: x.get("x"), y: x.get("y") }));
};

const unwrap = (arr) => {
  return arr.map((x) => x.get("y"));
};

const groups = (list) => {
  if (list.size <= 0) {
    return [];
  }
  const end = indexOfTime(list)(
    moment(list.first().get("x")).startOf("day").add(1, "day").valueOf()
  );
  return prepend(
    minOf(unwrap(slice(0, end, list))),
    groups(list.slice(end, list.size))
  );
};

const makeDays = (arr) => {};

// minOfEach :: [Number] -> [Number]
const minOfEach = (interval) => (arr) => {};

/*

Statistic methodology

Get rolling mean of minOfEach(day)
Get rolling std of minOfEach(day)

Get removeOutliers - throwout values from minOfEach(day) that deviate from the
rolling mean by more than the standard deviation - replace with the mean.

Get rolling mean after removingOutliers

Composition:
[Number] -> [Number] -> [Number]
rollingMean(removeOutliers(rollingMean(minOfEach(day)), rollingStd(minOfEach(day))))

*/

export const testPerformance = (props) => {
  console.log(props);
  const input = Array.from({ length: 2000 }, () =>
    Math.floor(Math.random() * 1000)
  );

  var t0 = performance.now();
  var result = fastRollingMean(30, input);
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

  var t0 = performance.now();
  var result = standardDeviationOf(input);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  console.log(getPlainList(props.database));

  const data = EnergyHistory(props.database);
  console.log(data);

  var t0 = performance.now();
  result = groups(props.database);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  //   for (const day of result) {
  //     console.log("------------------------------------");
  //     for (const hour of day) {
  //       console.log(moment(hour.get("x")).toString(), hour.get("y"));
  //     }
  //   }
};
