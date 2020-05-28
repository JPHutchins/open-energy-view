import {
  curry,
  compose,
  addIndex,
  map,
  chain,
  join,
  chian,
  ap,
  indexOf,
  lift,
  either,
  sum,
  isNil,
  slice,
  mean,
  range,
  isEmpty,
  prepend,
  reduce,
  drop,
  head,
  pipe,
  zip,
  zipObj,
  zipWith,
  __,
} from "ramda";
import {
  differenceInMilliseconds,
  getTime,
  isBefore,
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  add,
  sub,
  parse,
} from "date-fns";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import moment from "moment";
const { Map, List, first, toJS } = require("immutable");

const findMaxResolution = (intervalLength) => {
  const _dataPointLength = Math.abs(intervalLength) / 52;
  if (_dataPointLength >= 609785000) return "month";
  if (_dataPointLength >= 52538461) return "week";
  if (_dataPointLength >= 11630769 + 1) return "day";
  if (_dataPointLength >= 1661538 + 1) return "part";
  return "hour";
};

export const endOf = (interval) => {
  return {
    hour: endOfHour,
    day: endOfDay,
    week: endOfWeek,
    month: endOfMonth,
    year: endOfYear,
  }[interval];
};

export const startOf = (interval) => {
  return {
    hour: startOfHour,
    day: startOfDay,
    week: startOfWeek,
    month: startOfMonth,
    year: startOfYear,
  }[interval];
};

const intervalToWindow = (intervalType) => {
  return {
    hour: "day",
    part: "week",
    day: "month",
    week: "year",
    month: "complete",
  }[intervalType];
};

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

const makeIntervalArray = (interval) => {
  const _intervalLength = Math.abs(
    differenceInMilliseconds(interval.start, interval.end)
  );
  const _dataPointLength = findMaxResolution(_intervalLength);

  const intervalArray = [];
  const { start, end } = interval;
  if (_dataPointLength === "part") {
    console.error("Partitions not implemented");
    return Either.Left("Partitions not implemented");
  }
  const _dateAddFormat = { [`${_dataPointLength}s`]: 1 };
  let _start = new Date(start);
  while (isBefore(_start, end)) {
    intervalArray.push([_start, endOf(_dataPointLength)(_start)]);
    _start = add(_start, _dateAddFormat);
  }
  return intervalArray;
};

const findIntervalBounds = (intervalType) => (start, end = null) => {
  console.log(start, end);
  if (end) return { start: start, end: end };
  return {
    start: startOf(intervalType)(start),
    end: endOf(intervalType)(start),
  };
};

// minZero :: Number -> Number
export const minZero = (x) => Math.max(0, x);

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

// minOf :: [Number] -> Number
export const minOf = (A) => A.reduce((acc, x) => Math.min(acc, x), Infinity);

// meanOf :: [Number] -> Number
export const meanOf = (A) => A.reduce((acc, x) => acc + x, 0) / A.length;

export const standardDeviationOf = (A, _mean = null) => {
  _mean = _mean ? _mean : meanOf(A);
  const _variances = A.map((x) => (x - _mean) * (x - _mean));
  return Math.sqrt(meanOf(_variances));
};

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

  const _zipped = zipArrMeanStd(arr, _rMean, _rStd);
  const output = _zipped.map((x) =>
    x.arr < x.mean - x.std || x.arr > x.mean + x.std ? x.mean : x.arr
  );

  return Either.Right(output);
};

const zipArrMeanStd = (arr, mean, std) => {
  return zip(arr, zip(mean, std)).map((x) => ({
    arr: x[0],
    mean: x[1][0],
    std: x[1][1],
  }));
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

const fastRollingMean = (window) => (arr) => {
  const _iRange = range(0, arr.length);
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
  }, _iRange);

  return Either.Right(result);
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

// extract :: [{k: v}] -> [v]
const extract = (key) => (arr) => {
  return arr.map((x) => x.get(key));
};

const partitionScheme = Either.Right([
  { name: "Night", start: 1, color: "#FF0000" },
  { name: "Day", start: 7, color: "#00FF00" },
  { name: "Evening", start: 18, color: "#0000FF" },
]);

const crossAM = (i, partitions) => (i < 0 ? partitions.value.length - 1 : i);

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
        acc[crossAM(_index, partitions)].sum += x.get("y");
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
    return partitions.value[crossAM(_index, partitions)].color;
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

const groupByHour = groupBy("hour");
const groupByDay = groupBy("day");
const groupByWeek = groupBy("week");
const groupByMonth = groupBy("month");
const groupByYear = groupBy("year");

const makeDays = (arr) => {};

// minOfEach :: [[Number]] -> [Number]
const minOfEachDay = (arr) => {
  return arr.map((x) =>
    Map({
      x: getTime(startOf("day")(x.get(0).get("x"))),
      y: minOf(extract("y")(x)),
    })
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

const calculatePassiveUse = (database) => {
  const WINDOW = 14; // global config variable?

  const dailyMinimums = minOfEachDay(groupByDay(database));
  const values = Either.Right(extract("y")(dailyMinimums));
  const time = Either.Right(extract("x")(dailyMinimums));

  const passiveValues = values
    .chain(removeOutliers(WINDOW))
    .chain(fastRollingMean(WINDOW))
    .chain(makeFillWindow(WINDOW)(values.value)(meanOf));

  if (passiveValues.isLeft) return Either.Left(database);

  return List(
    zipWith((x, y) => Map({ x: x, y: y }), time.value, passiveValues.value)
  );
};

const getDataset = (database) => pipe(makeIntervalArray, findData(database));

// EnergyHistory :: f (a) -> f (b)
export class EnergyHistory {
  constructor(database, partitionOptions, interval, passiveUse = null) {
    this.database = database;
    this.partitionOptions = partitionOptions;
    this.passiveUse = passiveUse ? passiveUse : calculatePassiveUse(database);
    this._graphData = getDataset(database)({
      start: interval.start,
      end: interval.end,
    });
    this.data = {
      start: interval.start,
      end: interval.end,
      intervalSize: findMaxResolution(
        differenceInMilliseconds(interval.start, interval.end)
      ),
      datasets: [
        {
          label: "Energy Consumption",
          type: "bar",
          data: this._graphData.toJS(),
          backgroundColor: makeColorsArray(partitionOptions)(
            this._graphData
          ).toArray(),
        },
        {
          label: "Passive Consumption",
          type: "line",
          data: this.passiveUse,
        },
      ],
    };
    this.windowData = {
      windowSize: intervalToWindow(this.data.intervalSize),
      windowSum: sum(extract("y")(this._graphData)),
      partitionSums: sumPartitions(partitionOptions)(this._graphData),
    };
  }

  prev() {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: sub(this.data.start, one(this.windowData.windowSize)),
        end: sub(this.data.end, one(this.windowData.windowSize)),
      },
      (this.passiveUse = this.passiveUse)
    );
  }

  next() {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: add(this.data.start, one(this.windowData.windowSize)),
        end: add(this.data.end, one(this.windowData.windowSize)),
      },
      (this.passiveUse = this.passiveUse)
    );
  }

  setWindow(interval) {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: startOf(interval)(this.data.start),
        end: endOf(interval)(this.data.start),
      },
      (this.passiveUse = this.passiveUse)
    );
  }
}

export const testPerformance = (props) => {
  console.log(partitionScheme);
  console.log(props.database.last());
  const start = startOf("day")(new Date(props.database.last().get("x")));
  const end = endOf("day")(start);
  const test = new EnergyHistory(props.database, partitionScheme, {
    start: start,
    end: end,
  });
  console.log(test);
  console.log(test.prev());
  console.log(test.prev().prev());

  console.log(props);
  let input = Array.from({ length: 2000 }, () =>
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

  const colors = makeColorsArray(partitionScheme)(props.database.slice(-24));
  console.log(colors.toArray());
  //.slice(-720, -696)
  console.log(input);
  input = minOfEachDay(groupByDay(props.database));
  console.log(extract("y")(input));

  const makeCalculateBackgroundMetric = (window, database) => {
    return compose(
      chain(makeFillWindow(window)(database)(meanOf)),
      chain(fastRollingMean(window)),
      chain(removeOutliers(window))
    );
  };

  var time = Either.Right(extract("x")(input));

  var t0 = performance.now();
  //   var result = Either.Right(extract('y')(input))
  //     .chain(removeOutliers(14))
  //     .chain(fastRollingMean(14))
  //     .chain(makeFillWindow(14)(extract('y')(input))(meanOf));

  //   var result = zipWith((x, y) => ({x: x, y: y}), time.value, result.value)
  var result = calculatePassiveUse(props.database);
  console.log(result[result.length - 30]); // {x: 1586761200000, y: 1204.923469387756}
  console.log(result);

  var t1 = performance.now();
  console.log(
    "removeOutliers() & average took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  const calculateBG = makeCalculateBackgroundMetric(14, extract("y")(input));
  console.log(calculateBG);
  console.log(calculateBG(Either.Right(extract("y")(input))));

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
