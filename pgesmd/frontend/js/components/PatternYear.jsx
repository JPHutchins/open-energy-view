import React from "react";
import { Line } from "react-chartjs-2";

const PatternYear = ({ yLabelWidth, yearTotals }) => {
  const dataYear = {
    labels: new Array(52).fill("Jan"),
    datasets: [
      {
        label: "Total",
        data: yearTotals.map((x) => x.total),
        backgroundColor: "hsla(185, 16%, 83%, .5)",
        fill: true,
        borderColor: "#5f5566",
        pointRadius: 0,
      },
      {
        label: "Active",
        data: yearTotals.map((x) => x.active),
        borderColor: "orange",
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Passive",
        data: yearTotals.map((x) => x.passive),
        borderColor: "gray",
        fill: true,
        backgroundColor: "gray",
        pointRadius: 0,
      },
    ],
  };

  const tooltipLabelYear = (tooltipItems) => {
    const labels = dataYear.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    return `${Math.round(tooltipItems.yLabel)} ${label} Whs`;
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
        label: (tooltipItems) => tooltipLabelYear(tooltipItems),
        title: () => "Average Usage",
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

  return <Line data={dataYear} options={options} />;
};
export default PatternYear;
