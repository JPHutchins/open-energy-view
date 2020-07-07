import React from "react";
import Icon from "@mdi/react";
import {
  mdiWeatherNight,
  mdiWeatherSunsetUp,
  mdiWeatherSunsetDown,
  mdiWeatherSunny,
} from "@mdi/js";
import { Line } from "react-chartjs-2";
import { groupBy } from "../functions/groupBy";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { minZero } from "../functions/minZero";
import { max, sum, min } from "ramda";
import { maxOf } from "../functions/maxOf";
import { minOf } from "../functions/minOf";

const PatternChart = ({ energyHistory }) => {
  const [gradient, setGradient] = useState({ day: "", week: "" });
  const dayGroups = groupBy("day")(energyHistory.database);
  const weekGroupsUncut = groupBy("week")(energyHistory.database);

  const weekChart = useRef(null);
  const dayChart = useRef(null);

  const yLabelWidth = 50;

  const weekGroups = weekGroupsUncut.slice(1, weekGroupsUncut.length - 1);

  const partTimes = energyHistory.partitionOptions.value.map((x) => x.start);
  partTimes[0] = 24; // TEMPORARY HACK
  const colorsArray = [];
  let j = 1;
  for (let i = 0; i < 24; i++) {
    if (j % 3 === energyHistory.partitionOptions.value.length - 1) {
      colorsArray.push(energyHistory.partitionOptions.value[j].color);
    } else if (i <= partTimes[j % 3]) {
      colorsArray.push(energyHistory.partitionOptions.value[j].color);
    } else {
      j++;
    }
  }

  const getMeans = (groups, type, hoursInEachGroup) => {
    const sums = groups.reduce((acc, day) => {
      for (let hour = 0; hour < day.size; hour++) {
        acc[hour] += day.get(hour).get(type);
      }
      return acc;
    }, new Array(hoursInEachGroup).fill(0));
    const means = sums.map((x) => x / groups.length);
    return means;
  };

  const dayTotals = getMeans(dayGroups, "total", 24).slice(0, 24);
  const dayActive = getMeans(dayGroups, "active", 24);

  const weekTotals = getMeans(weekGroups, "total", 24 * 7).slice(0, 7 * 24);
  const weekActive = getMeans(weekGroups, "active", 24 * 7);
  const weekPassive = getMeans(weekGroups, "passive", 24 * 7);

  const suggestedMax = max(maxOf(dayTotals), maxOf(weekTotals));
  const suggestedMin = min(minOf(dayTotals), minOf(weekTotals));

  const weekLabel = new Array(7 * 24).fill("");

  useEffect(() => {
    let ctx = dayChart.current.chartInstance.ctx;

    const makeGradient = (ctx, days) => {
      const width = ctx.canvas.clientWidth;
      const gradient = ctx.createLinearGradient(yLabelWidth, 0, width - 10, 0);

      for (let d = 0; d < days; d++) {
        let previousColor =
          energyHistory.partitionOptions.value[
            energyHistory.partitionOptions.value.length - 1
          ].color;
        for (let i = 0; i < energyHistory.partitionOptions.value.length; i++) {
          const start = energyHistory.partitionOptions.value[i].start;
          const color = energyHistory.partitionOptions.value[i].color;

          const firstStop = (minZero(start - 2) / 24 + d) / days;
          const secondStop = ((start + 2) / 24 + d) / days;

          gradient.addColorStop(firstStop, previousColor);
          gradient.addColorStop(secondStop, color);

          previousColor = color;
        }
      }
      return gradient;
    };

    setGradient({
      day: makeGradient(dayChart.current.chartInstance.ctx, 1),
      week: makeGradient(weekChart.current.chartInstance.ctx, 7),
    });
  }, []);

  let dataWeek = {
    labels: weekLabel,
    datasets: [
      {
        data: weekTotals,
        backgroundColor: gradient.week,
      },
    ],
  };

  const dataDay = {
    labels: new Array(24).fill(""),
    datasets: [
      {
        data: dayTotals,
        backgroundColor: gradient.day,
      },
    ],
  };

  const intToHour = (int) => {
    int = Math.floor(int) % 24;
    if (int === 0) return "12:00 AM";
    if (int <= 12) return `${int}:00 AM`;
    return `${int - 12}:00 PM`;
  };

  const tooltipLabelWeek = (tooltipItems) => {
    let weekDay = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    weekDay = weekDay[Math.floor(tooltipItems.index / 24)];

    const day = Math.floor(tooltipItems.index / 24);
    const total = Math.round(sum(weekTotals.slice(day * 24, (day + 1) * 24)));

    return `${Math.round(tooltipItems.yLabel)} Wh\n${total} Whs / day`;
  };

  const options = {
    legend: {
      display: false,
    },
    hover: {
      mode: "nearest",
      intersect: true,
    },
    tooltips: {
      callbacks: {
        label: (tooltipItems) => tooltipLabelWeek(tooltipItems),
        title: (tooltipItems) => intToHour(tooltipItems[0].index),
      },
      mode: "index",
      intersect: false,
    },
    responsiveness: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0,
      },
    },
    scales: {
      xAxes: [
        {
          afterFit: function (scaleInstance) {
            scaleInstance.height = 0;
          },
          gridLines: {
            display: false,
            offsetGridLines: true,
          },
          ticks: {
            max: 167,
            min: 11,
            stepSize: 12,
          },
        },
      ],
      yAxes: [
        {
          afterFit: function (scaleInstance) {
            scaleInstance.width = yLabelWidth; // sets the width to 100px
          },
          ticks: {
            suggestedMin: suggestedMin,
            suggestedMax: suggestedMax,
          },
        },
      ],
    },
  };

  return (
    <div
      style={{
        display: "flex",
        padding: "10px",
        position: "relative",
        margin: "auto",
        height: "100%",
      }}
    >
      <div className="pattern-div-2-rectangle">
        <div className="pattern-title">Average Use Each Day</div>
        <Line ref={dayChart} data={dataDay} options={options} />
        <div className="pattern-day-labels-container">
          <div className="pattern-labels-day">
            <Icon
              path={mdiWeatherNight}
              width="30px"
              color="hsla(253, 43%, 26%, 1)"
            />
            <Icon
              path={mdiWeatherSunny}
              width="30px"
              color="hsla(47, 98%, 48%, 1)"
            />
            <div></div>
          </div>
        </div>
      </div>
      <div className="pattern-div-4-rectangle">
        <div className="pattern-title">Average Use Each Week</div>
        <Line ref={weekChart} data={dataWeek} options={options} />
        <div className="pattern-week-labels-container">
          <div className="pattern-labels-week">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PatternChart;
