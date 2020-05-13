import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";

const EnergyDisplay = (props) => {
  const [day, setDay] = useState(1);

  const datasets = {
    datasets: [
      {
        data: props.database.slice(-24 * day, -24 * (day - 1)).toJS(),
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
    <div>
      <EnergyChart data={datasets} options={options} />
      <button onClick={() => setDay(day + 1)}>Click me</button>
    </div>
  );
};
export default EnergyDisplay;
