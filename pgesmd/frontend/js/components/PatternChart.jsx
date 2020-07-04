import React from "react";
import { Line } from "react-chartjs-2";
import { groupBy } from "../functions/groupBy";

const PatternChart = ({ energyHistory }) => {
  const dayGroups = groupBy("day")(energyHistory.database);
  const weekGroupsUncut = groupBy("week")(energyHistory.database);

  console.log(new Date(weekGroupsUncut[1].get(0).get("x")))

  const weekGroups = weekGroupsUncut.slice(1, weekGroupsUncut.length - 1)

  const partTimes = energyHistory.partitionOptions.value.map(x => x.start)
  partTimes[0] = 24 // TEMPORARY HACK
  const colorsArray = []
  let j = 1;
  for (let i = 0; i < 24; i++) {
    if (j%3 === energyHistory.partitionOptions.value.length - 1) {
      colorsArray.push(energyHistory.partitionOptions.value[j].color)
    }
     else if (i <= partTimes[j%3]) {
      colorsArray.push(energyHistory.partitionOptions.value[j].color)
    } else {
      j++
    }
  }

  console.log(colorsArray)


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

  const dayTotals = getMeans(dayGroups, "total", 24)
  const dayActive = getMeans(dayGroups, "active", 24)

  const weekTotals = getMeans(weekGroups, "total", 24*7)
  const weekActive = getMeans(weekGroups, "active", 24*7)
  const weekPassive = getMeans(weekGroups, "passive", 24*7)

  const dayLabel = [
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
  ]

  const dayToWeekArray = (arr) => {
    let labels = [];
    for (let _ = 0; _ < 7; _++) {
      labels = labels.concat(arr.slice())
    }
    
    return labels
  }

  const dataWeek = {
    labels: dayToWeekArray(dayLabel),
    datasets: [
      {
        data: weekTotals,
        backgroundColor: dayToWeekArray(colorsArray),
      },
    ],
  }

  

  const dataDay = {
    labels: dayLabel,
    datasets: [
      {
        data: dayTotals,
      },
      {
        data: dayActive,
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
      
      <Line data={dataWeek} options={options} />
    </div>
  );
};
export default PatternChart;
