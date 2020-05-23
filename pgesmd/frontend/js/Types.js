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
  reduce,
  drop,
  head,
  zip,
  zipObj,
} from "ramda";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import moment from "moment";
const { Map, List, first } = require("immutable");

// EnergyHistory :: f (a) -> f (a)
export const EnergySHistory = (database) => ({
  of: (database) => EnergyHistory(database),
  map: (f) => EnergyHistory(data.map(f)),
  database: database,
});

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

export const standardDeviationOf = (A, _mean = null) => {
  _mean = _mean ? _mean : meanOf(A);
  const _deviations = A.map((x) => (x - _mean) * (x - _mean));
  return Math.sqrt(meanOf(_deviations));
};

export const removeOutliers = (window) => (arr) => {
  const _rMean = rolling(meanOf, window, arr).slice(window - 1);
  const _rStd = rolling(standardDeviationOf, window, arr).slice(window - 1);
  const _zipped = zip(arr, zip(_rMean, _rStd)).map((x) => ({
    arr: x[0],
    mean: x[1][0],
    std: x[1][1],
  }));
  const output = _zipped.map((x) =>
    x.arr < x.mean - x.std || x.arr > x.mean + x.std ? x.mean : x.arr
  );
  return Either.Right(output);
};

const zipArrMeanStd = (arr, mean, std) => {
  return zip(arr, zip(_rMean, _rStd)).map((x) => ({
    arr: x[0],
    mean: x[1][0],
    std: x[1][1],
  }));
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

const fastRollingMean = (n) => (arr) => {
  const _iRange = range(0, arr.length);
  let _sum = 0;
  let _avg = 0;

  const result = map((i) => {
    if (i - n + 1 < 0) {
      _sum = _sum + arr[i];
      _avg = _sum / (i + 2);
      return "NotANumber";
    } else if (i - n + 1 === 0) {
      _avg = _avg + arr[i] / n;
      return _avg;
    }
    _avg = _avg + (arr[i] - arr[i - n]) / n;
    return _avg;
  }, _iRange);

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

const partitionScheme = Either.Left([
  { name: "Night", start: 1 },
  { name: "Day", start: 7 },
  { name: "Evening", start: 18 },
]);

const sumPartitions = (partitions) => (data) => {
  if (partitions.isLeft) return data;

  partitions = partitions.map(
    map((x) => ({
      name: x.name,
      start: x.start,
      sum: 0,
    }))
  );
  const _crossAM = (i) => (i < 0 ? partitions.value.length - 1 : i);
  const result = (data) =>
    reduce(
      (acc, x) => {
        const _hour = moment(x.get("x")).format("H");
        const _index = partitions.chain(
          reduce((acc, x) => {
            return _hour >= x.start ? acc + 1 : acc;
          }, -1)
        );
        acc[_crossAM(_index)].sum += x.get("y");
        return acc;
      },
      partitions.value,
      data
    );
  return result(data);
};

const groupBy = (interval) => (list) => {
  if (list.size <= 0) {
    return [];
  }
  const guess = {
    hour: 4,
    day: 24,
    week: 168,
    month: 744,
    year: 8760,
  }[interval];
  const endMoment = moment(list.first().get("x"))
    .startOf(interval)
    .add(1, interval)
    .valueOf();
  const endIndex =
    list[guess] === endMoment ? guess : indexOfTime(list)(endMoment);
  return prepend(
    slice(0, endIndex, list),
    groupBy(interval)(list.slice(endIndex, list.size))
  );
};

const groupByHour = groupBy("hour");
const groupByDay = groupBy("day");
const groupByWeek = groupBy("week");
const groupByMonth = groupBy("month");
const groupByYear = groupBy("year");

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
  var result = sumPartitions(partitionScheme)(props.database);
  var t1 = performance.now();
  console.log(
    "sumPartitions() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = fastRollingMean(14, input);
  var t1 = performance.now();
  console.log(
    "fastRollingMean() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = rolling(meanOf, 14, input);
  var t1 = performance.now();
  console.log(
    "rolling(mean) took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = rolling(standardDeviationOf, 14, input).slice(13);
  var t1 = performance.now();
  console.log(
    "rolling(standardDeviationOf) took",
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

  console.log(input);

  var t0 = performance.now();
  var result = Either.Right(input)
    .chain(removeOutliers(14))
    .map(fastRollingMean(14));
  var t1 = performance.now();
  console.log(
    "removeOutliers() & average took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = removeOutliers(input, 14);
  var t1 = performance.now();
  console.log(
    "removeOutliers() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  console.log(getPlainList(props.database));

  const data = EnergyHistory(props.database);
  console.log(data);

  var t0 = performance.now();
  result = groupByDay(props.database);
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
