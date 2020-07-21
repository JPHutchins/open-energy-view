import React from "react";
import { useRef, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { minZero } from "../../functions/minZero";
import { editHsl } from "../../functions/editHsl";
import { sum } from "ramda";

const PatternWeek = ({
  energyHistory,
  suggestedMin,
  suggestedMax,
  yLabelWidth,
  weekTotals,
  recentWeekTotals,
}) => {
  const [gradient, setGradient] = useState("");

  const weekChart = useRef(null);

  const makeGradient = (ctx, days, partitionOptions) => {
    const width = ctx.canvas.clientWidth;
    const EST_CHARTJS_RIGHT_MARGIN = 10;
    const gradient = ctx.createLinearGradient(
      yLabelWidth,
      0,
      width - EST_CHARTJS_RIGHT_MARGIN,
      0
    );

    for (let d = 0; d < days; d++) {
      let previousColor = partitionOptions[partitionOptions.length - 1].color;
      previousColor = editHsl(previousColor, { l: (l) => (l + 100) / 2 });

      for (let i = 0; i < partitionOptions.length; i++) {
        const start = partitionOptions[i].start;

        let color = partitionOptions[i].color;
        color = editHsl(color, { l: (l) => (l + 100) / 2 });

        const firstStop = (minZero(start - 2) / 24 + d) / days;
        const secondStop = ((start + 2) / 24 + d) / days;

        gradient.addColorStop(firstStop, previousColor);
        gradient.addColorStop(secondStop, color);

        previousColor = color;
      }
    }
    return gradient;
  };

  const calculateGradient = () =>
    setTimeout(() => {
      setGradient(
        makeGradient(
          weekChart.current.chartInstance.ctx,
          7,
          energyHistory.partitionOptions.value
        )
      );
    }, 0);

  useEffect(() => {
    calculateGradient();
    window.addEventListener("resize", calculateGradient);
    return () => window.removeEventListener("resize", calculateGradient);
  }, []);

  const dataWeek = {
    labels: new Array(24 * 7).fill(""),
    datasets: [
      {
        label: "Complete History",
        data: weekTotals,
        backgroundColor: gradient,
        borderColor: "#5f5566",
      },
      {
        label: "Past 4 Weeks",
        data: recentWeekTotals,
        borderColor: "green",
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
      display: true,
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
            display: true,
          },
          ticks: {
            maxTicksLimit: 7,
          },
        },
      ],
      yAxes: [
        {
          afterFit: function (scaleInstance) {
            scaleInstance.width = yLabelWidth; // sets the width to 100px
          },
          ticks: {
            min: 0,
            maxTicksLimit: 5,
          },
        },
      ],
    },
  };

  return <Line ref={weekChart} data={dataWeek} options={options} />;
};
export default PatternWeek;
