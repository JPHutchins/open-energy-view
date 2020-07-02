import React from "react";
import { Line } from "react-chartjs-2";
import { groupBy } from "../functions/groupBy";

const PatternChart = ({ energyHistory }) => {
  const dayGroups = groupBy("day")(energyHistory.database);

  const getMeans = (groups, type, hoursInEachGroup) => {
      const sums = groups.reduce((acc, day) => {
        for (let hour = 0; hour < day.size; hour++) {
          acc[hour] += day.get(hour).get(type);
        }
        return acc;
      }, new Array(hoursInEachGroup).fill(0))
      const means = sums.map((x) => x / groups.length);
      return means;
  }

  const totals = getMeans(dayGroups, "total", 24)

  const active = getMeans(dayGroups, "active", 24)

  const data = {
    labels: [
      "Midnight",
      "",
      "",
      "",
      "",
      "",
      "6AM",
      "",
      "",
      "",
      "",
      "",
      "Noon",
      "",
      "",
      "",
      "",
      "",
      "6PM",
      "",
      "",
      "",
      "",
      "",
    ],
    datasets: [
      {
        data: totals,
      },
      {
        data: active,
      },
    ],
  };

  const options = {};

  return (
    <div
      style={{
        display: "flex",
        padding: "10px",
        position: "relative",
        margin: "auto",
        height: "100%",
        width: "100%",
      }}
    >
      <Line data={data} options={options} />
    </div>
  );
};
export default PatternChart;
