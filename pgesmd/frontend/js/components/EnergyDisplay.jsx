import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";

const EnergyDisplay = (props) => {
  const [past, setPast] = useState(0);
  const [startDate, setStartDate] = useState(moment(props.database.get(-1).get("x")));
  const [endDate, setEndDate] = useState(moment(props.database.get(-1).get("x")));
  const [intervalType, setIntervalType] = useState("month");
  const [data, setData] = useState(
    props.database.slice(-24 * past, -24 * (past - 1)).toJS()
  );

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
    console.log(Math.ceil((lastMoment - firstMoment) / 86400000));
  };

  const pipe = (...functions) => (x, ...args) =>
    functions.reduce((v, f) => f(v, ...args), x);

  const findIntervalBounds = (intervalType) => (start, end=null) => {
      console.log(start, end)
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
    console.log(interval.start, interval.end)

    const intervalArray = [];
    const { start, end } = interval;
    if (_dataPointLength === "part") {
      console.error("Partitions not implemented");
      return [];
    }
    const _start = moment(start);
    // TODO: fix this mess with add hour/take away hour - needs to work for finer datasets too!
    const _end = (_start) => {
        if (_intervalLength === "hour") return _start.add(1, "hour")
        return _start.endOf(_dataPointLength).startOf('hour')
    }
    while (_start.isBefore(end)) {
      intervalArray.push([
        moment(_start),
        moment(_end(_start)),
      ]);
      _start.add(1, "hour");
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

  const theData = (
    intervalType !== "total"
      ? result(startDate)
      : result(moment(props.database.get(0).get("x")), endDate)
  );
  console.log(theData);

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
      <EnergyChart data={datasets} options={options} />
      <button
        onClick={() =>
          setStartDate(moment(startDate.subtract(1, intervalType)))
        }
      >
        Previous
      </button>
      <button
        onClick={() => setStartDate(moment(startDate.add(1, intervalType)))}
      >
        Next
      </button>
      <button onClick={() => setIntervalType("day")}>Day</button>
      <button onClick={() => setIntervalType("week")}>Week</button>
      <button onClick={() => setIntervalType("month")}>Month</button>
      <button onClick={() => setIntervalType("year")}>Year</button>
      <button onClick={() => setIntervalType("total")}>total</button>
    </div>
  );
};
export default EnergyDisplay;
