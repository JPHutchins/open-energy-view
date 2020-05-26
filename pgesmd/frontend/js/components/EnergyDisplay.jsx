import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";
import { EnergyHistory } from "../Types";
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
import { Maybe, IO, Either, Identity } from "ramda-fantasy";

const EnergyDisplay = (props) => {
    const partitionScheme = Either.Right([
        { name: "Night", start: 1, color: "#FF0000" },
        { name: "Day", start: 7, color: "#00FF00" },
        { name: "Evening", start: 18, color: "#0000FF" },
      ]);
  const start = moment(props.database.last().get("x")).startOf("day");
  const end = moment(start).endOf("day");
  const tester = new EnergyHistory(props.database, partitionScheme, {
    start: start,
    end: end,
  });

  const [past, setPast] = useState(0);
  const [startDate, setStartDate] = useState(
    moment(props.database.get(-1).get("x"))
  );
  const [endDate, setEndDate] = useState(
    moment(props.database.get(-1).get("x"))
  );
  const [intervalType, setIntervalType] = useState("month");
  const [data, setData] = useState(
    props.database.slice(-24 * past, -24 * (past - 1)).toJS()
  );
  const [test, setTest] = useState(tester);

  const makeData = (past) => {
    return props.database.slice(-24 * (past + 1), -24 * past).toJS();
  };

  const rMoment = (past) => {
    return moment(props.database.get(-(24 * past) - 1).get("x"));
  };

  const lMoment = (past) => {
    return moment(props.database.get(-(24 * past) - 730).get("x"));
  };

  const intervals = (firstMoment, lastMoment) => {
  };

  /**
   * Pipe the output of each function to the input of the next, left to right.
   * @param  {...any} functions The functions to be piped.
   */
  const pipe = (...functions) => (x, ...args) =>
    functions.reduce((v, f) => f(v, ...args), x);

  const findIntervalBounds = (intervalType) => (start, end = null) => {
    if (end) return { start: start, end: end };
    return {
      start: moment(start.startOf(intervalType)),
      end: moment(start.endOf(intervalType)),
    };
  };

  const findMaxResolution = (intervalLength) => {
    const _dataPointLength = intervalLength / 52;
    if (_dataPointLength >= 609785000) return "month";
    if (_dataPointLength >= 52538461) return "week";
    if (_dataPointLength >= 11630769 + 1) return "day";
    if (_dataPointLength >= 1661538 + 1) return "part";
    return "hour";
  };

  const makeIntervalArray = (interval) => {
    const _intervalLength = Math.abs(interval.start.diff(interval.end));
    const _dataPointLength = findMaxResolution(_intervalLength);

    const intervalArray = [];
    const { start, end } = interval;
    if (_dataPointLength === "part") {
      console.error("Partitions not implemented");
      return [];
    }
    const _start = moment(start);
    while (_start.isBefore(end)) {
      intervalArray.push([
        moment(_start),
        moment(_start.endOf(_dataPointLength)),
      ]);
      _start.add(1, "minute").startOf("hour");
    }
    return intervalArray;
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
    return m + 1; //If not found return index for "insert"
  };

  const findData = (database) => (intervalArray) => {
    const indexOf = indexOfTime(database);

    const data = intervalArray.map((point) => {
      const [_startTime, _endTime] = point;
      const _startIndex = indexOf(_startTime.valueOf());
      const _endIndex = indexOf(_endTime.valueOf());
      const _slice = database.slice(_startIndex, _endIndex);
      const _sum = _slice.reduce((a, v) => a + v.get("y"), 0);
      const _mean = Math.round(_sum / (_endIndex - _startIndex));
      return {
        x: _startTime.valueOf(),
        y: _mean,
        sum: _sum,
      };
    });
    return data;
  };

  const result = pipe(
    findIntervalBounds(intervalType),
    makeIntervalArray,
    findData(props.database)
  );

  intervals(lMoment(past), rMoment(past));

  const theData =
    intervalType !== "total"
      ? result(startDate)
      : result(moment(props.database.get(0).get("x")), endDate);

  const datasets = {
    datasets: [
      {
        data: theData,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsiveness: true,
    legend: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Time Interval",
          },
          type: "time",
          bounds: "ticks",
          ticks: {
            beginAtZero: true,
            // labelOffset: xLabelOffset,
            // min: data[0].interval_start,
            // max: data[data.length - 1].interval_end - 1000,
          },
          time: {
            displayFormats: {
              hour: "hA",
              day: "M/D",
            },
          },
          offset: intervalType === "day" ? true : true,
          gridLines: {
            offsetGridLines: intervalType === "day" ? true : true,
          },
          barThickness: "flex",
        },
      ],
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Average Watts of Electricity",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            // suggestedMax: database.get("info").get("max_watt_hour")
            suggestedMax: 5000,
          },
        },
      ],
    },
  };

  return (
    <div style={{ height: "80%" }}>
      <EnergyChart data={test.data} options={options} />
      <button onClick={() => setTest(test.prev())}>Previous</button>
      <button
        onClick={() => setTest(test.next())}
      >
        Next
      </button>
      <button onClick={() => setTest(test.setWindow("day"))}>Day</button>
      <button onClick={() => setTest(test.setWindow("week"))}>Week</button>
      <button onClick={() => setTest(test.setWindow("month"))}>Month</button>
      <button onClick={() => setTest(test.setWindow("year"))}>Year</button>
      <button onClick={() => setTest(test.setWindow("total"))}>total</button>
    </div>
  );
};
export default EnergyDisplay;
