import React from "react";
import { useRef, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { minZero } from "../functions/minZero";
import { editHsl } from "../functions/editHsl";

const PatternDay = ({
  energyHistory,
  suggestedMin,
  suggestedMax,
  yLabelWidth,
  dayTotals,
  recentDayTotals,
}) => {
  const [gradient, setGradient] = useState("");

  const dayChart = useRef(null);

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
          dayChart.current.chartInstance.ctx,
          1,
          energyHistory.partitionOptions.value
        )
      );
    }, 0);

  useEffect(() => {
    calculateGradient();
    window.addEventListener("resize", calculateGradient);
    return () => window.removeEventListener("resize", calculateGradient);
  }, []);

  const dataDay = {
    labels: new Array(24).fill(""),
    datasets: [
      {
        label: "Complete",
        data: dayTotals,
        backgroundColor: gradient,
        borderColor: "#5f5566",
      },
      {
        label: "Past 4 Weeks",
        data: recentDayTotals,
        borderColor: "green",
      },
    ],
  };

  const intToHour = (int) => {
    int = Math.floor(int) % 24;
    if (int === 0) return "12:00 AM";
    if (int < 12) return `${int}:00 AM`;
    if (int === 12) return "12:00 PM";
    return `${int - 12}:00 PM`;
  };

  const tooltipLabelDay = (tooltipItems) => {
    return `${Math.round(tooltipItems.yLabel)} Wh`;
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
        label: (tooltipItems) => tooltipLabelDay(tooltipItems),
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

  return <Line ref={dayChart} data={dataDay} options={options} />;
};
export default PatternDay;
