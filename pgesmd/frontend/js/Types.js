import {
  compose,
  addIndex,
  map,
  chain,
  sum,
  slice,
  range,
  prepend,
  reduce,
  pipe,
  zipWith,
  __,
} from "ramda";
import { differenceInMilliseconds, getTime, format, add, sub } from "date-fns";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import findMaxResolution from "./functions/findMaxResolution";
const { Map, List, first, toJS } = require("immutable");

const findData = (database) => (intervalArray) => {
  const indexOf = indexOfTime(database);

  const data = intervalArray.map((point) => {
    const [_startTime, _endTime] = point;
    const _startIndex = indexOf(getTime(_startTime));
    const _endIndex = indexOf(getTime(_endTime));
    const _slice = database.slice(_startIndex, _endIndex);
    const _sum = _slice.reduce((a, v) => a + v.get("y"), 0);
    const _mean = Math.round(_sum / (_endIndex - _startIndex));
    return Map({
      x: getTime(_startTime),
      y: _mean,
      sum: _sum,
    });
  });
  return List(data);
};

const findIntervalBounds = (intervalType) => (start, end = null) => {
  console.log(start, end);
  if (end) return { start: start, end: end };
  return {
    start: startOf(intervalType)(start),
    end: endOf(intervalType)(start),
  };
};

// makeIntervalBounds :: String -> Moment -> {k: v}
export const makeIntervalBounds = (intervalType) => (start, end = null) => {
  if (end) return { start: start, end: end };
  return {
    start: startOf(intervalType)(start),
    end: endOf(intervalType)(start),
  };
};

// dayBounds :: Moment -> {k: v}
export const dayBounds = makeIntervalBounds("day");

const makeFillWindow = (window) => (arrInput) => (f) => (arr) => {
  const length = arr.length;
  const middle = Math.floor(window / 2);
  const output = addIndex(map)(
    (x, i) => (i < window ? arr[window] : x),
    arr
  ).slice(middle);

  const remainingWindow = length - output.length;
  const windowRange = range(1, remainingWindow + 1).reverse();
  for (let rWindow of windowRange) {
    output.push(f(arrInput.slice(length - rWindow - middle)));
  }
  return Either.Right(output);
};

export const removeOutliers = (window) => (arr) => {
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

  return time < database.get(m).get("x") ? m : m + 1;
};

const partitionScheme = Either.Right([
  { name: "Night", start: 1, color: "#FF0000" },
  { name: "Day", start: 7, color: "#00FF00" },
  { name: "Evening", start: 18, color: "#0000FF" },
]);

const sumPartitions = (partitions) => (data) => {
  // TODO: implement memoized DP for subset of already calculated sums
  // Store tabulation [obj (first sum), ..., obj (result)]
  // Subset: sum(i, j) -> dp[j] - dp[i - 1]
  // This would be cleared if user changes partition boundaries!
  // O(1) for subsequent calls - call it on every initial load in/ part update?
  if (partitions.isLeft) return data;

  partitions = partitions.map(
    map((x) => ({
      name: x.name,
      start: x.start,
      sum: 0,
    }))
  );
  const result = (data) =>
    reduce(
      (acc, x) => {
        const _hour = format(new Date(x.get("x")), "H");
        const _index = partitions.chain(
          reduce((acc, x) => {
            return _hour >= x.start ? acc + 1 : acc;
          }, -1)
        );
        const _i = _index < 0 ? partitions.value.length - 1 : _index;
        acc[i].sum += x.get("y");
        return acc;
      },
      partitions.value,
      data
    );
  return result(data);
};

const makeColorsArray = (partitions) => (data) => {
  const first = new Date(data.first().get("x"));
  const last = new Date(data.last().get("x"));
  if (Math.abs(differenceInMilliseconds(first, last)) > 86400000) return List();

  const output = map((x) => {
    const _hour = format(new Date(x.get("x")), "H");
    const _index = partitions.chain(
      reduce((acc, x) => {
        return _hour >= x.start ? acc + 1 : acc;
      }, -1)
    );
    const _i = _index < 0 ? partitions.value.length - 1 : _index;
    return partitions.value[_i].color;
  }, data);
  return output;
};

const one = (interval) => {
  return {
    hour: { hours: 1 },
    day: { days: 1 },
    week: { weeks: 1 },
    month: { months: 1 },
    year: { years: 1 },
  }[interval];
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
  const start = new Date(list.first().get("x"));
  const endMoment = getTime(add(start, one(interval)));
  const endIndex =
    list[guess] === endMoment ? guess : indexOfTime(list)(endMoment);
  return prepend(
    slice(0, endIndex, list),
    groupBy(interval)(list.slice(endIndex, list.size))
  );
};





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



const getDataset = (database) => pipe(makeIntervalArray, findData(database));



