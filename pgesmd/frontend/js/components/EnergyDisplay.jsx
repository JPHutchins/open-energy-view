import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";

const EnergyDisplay = (props) => {
  const [past, setPast] = useState(0);
  const [intervalType, setIntervalType] = useState("month");
  const [data, setData] = useState(
    props.database.slice(-24 * past, -24 * (past - 1)).toJS()
  );

  const makeData = (past) => {
    return props.database.slice(-24 * (past + 1), -24 * past + 1).toJS();
  };

  const rMoment = (past) => {
    return moment(props.database.get(-(24 * past) - 1).get("x"));
  };

  const lMoment = (past) => {
    return moment(props.database.get(-(24 * past) - 730).get("x"));
  };

  const intervals = (firstMoment, lastMoment) => {
    console.log(Math.ceil((lastMoment - firstMoment) / 86400000));
  };

  const pipe = (...functions) => (x, ...args) =>
    functions.reduce((v, f) => f(v, ...args), x);

  const findIntervalBounds = (intervalType) => (start, end = null) => {
    if (end) return { start, end };
    return {
      start: moment(start.startOf(intervalType)),
      end: moment(start.endOf(intervalType)),
    };
  };

  const findMaxResolution = (intervalLength) => {
    const _dataPointLength = intervalLength / 52;
    if (_dataPointLength >= 606538461 + 1) return "month";
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
        moment(_start.add(1, _dataPointLength)),
      ]);
    }
    return intervalArray;
  };

  const indexOfStart = (database) => (start) => {
    let l = 0;
    let r = database.size - 1;
    let m = 0;

    while (l <= r) {
      m = Math.floor((l + r) / 2);
      const _current = database.get(m).get("x");
      if (start === _current) return m;
      start < _current ? (r = m - 1) : (l = m + 1);
    }
    return m;
  };

  const findData = (database) => (intervalArray) => {
    const indexOf = indexOfStart(database);

    const data = intervalArray.map((point) => {
      const [_startTime, _endTime] = point;
      const _startIndex = indexOf(_startTime.valueOf());
      const _endIndex = indexOf(_endTime.valueOf());
      console.assert(
        database.get(_startIndex).get("x") === _startTime.valueOf(),
        "Index not found"
      );
      const _slice = database.slice(_startIndex, _endIndex);
      const _sum = _slice.reduce((a, v) => a + v.get("y"), 0);
      const _mean = _sum / (_endIndex - _startIndex);
      return ({
          x: _startTime.valueOf(),
          y: _mean,
          sum: _sum
      })
    });
    return data;
  };

  const result = pipe(
    findIntervalBounds(intervalType),
    makeIntervalArray,
    findData(props.database)
  )(moment("2019-05-01", "YYYY-MM-DD"));
  console.log(result);

  intervals(lMoment(past), rMoment(past));

  const datasets = {
    datasets: [
      {
        data: makeData(past),
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
            unit: "hour",
            displayFormats: "hA",
          },
          offset: false,
          gridLines: {
            offsetGridLines: false,
          },
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
      <EnergyChart data={datasets} options={options} />
      <button onClick={() => setPast(past + 1)}>Previous</button>
      <button onClick={() => setPast(past - 1)}>Next</button>
      <button onClick={() => setInterval("hour")}>Hours</button>
      <button onClick={() => setInterval("day")}>Days</button>
    </div>
  );
};
export default EnergyDisplay;
