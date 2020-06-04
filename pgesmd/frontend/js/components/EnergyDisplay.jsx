import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";
import { EnergyHistory } from "../data-structures/EnergyHistory";
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
import { startOfDay, endOfDay } from "date-fns";

const EnergyDisplay = (props) => {
  const [test, setTest] = useState(props.tester);

  console.log(test.windowData.partitionSums)

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
          offset:true,
          gridLines: {
            offsetGridLines: true,
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
      <button onClick={() => setTest(test.next())}>Next</button>
      <button onClick={() => setTest(test.setWindow("day"))}>Day</button>
      <button onClick={() => setTest(test.setWindow("week"))}>Week</button>
      <button onClick={() => setTest(test.setWindow("month"))}>Month</button>
      <button onClick={() => setTest(test.setWindow("year"))}>Year</button>
      <button onClick={() => setTest(test.setWindow("total"))}>total</button>
    </div>
  );
};
export default EnergyDisplay;
