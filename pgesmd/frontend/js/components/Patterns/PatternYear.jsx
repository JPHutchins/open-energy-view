import React from "react";
import { Line } from "react-chartjs-2";
import { editHsl } from "../../functions/editHsl";

const PatternYear = ({ yLabelWidth, yearTotals }) => {
  const dataYear = {
    labels: new Array(12).fill("Jan"),
    datasets: [
      {
        label: "Total",
        data: yearTotals.map((x) => x.total),
        fill: "+1",
        backgroundColor: editHsl("hsl(275, 9%, 37%)", {
          s: (s) => (s + 100) / 2,
          l: (l) => 90,
        }),
        borderColor: "hsl(275, 9%, 37%)",
        pointRadius: 0,
      },
      {
        label: "Passive",
        data: yearTotals.map((x) => x.passive),
        borderColor: "hsla(185, 16%, 83%, .5)",
        fill: true,
        borderColor: "gray",
        backgroundColor: editHsl("hsla(185, 16%, 83%, 1)", {
          l: (l) => (l + 100) / 2,
        }),
        pointRadius: 0,
      },
    ],
  };

  const tooltipLabelYear = (tooltipItems) => {
    const labels = dataYear.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    return `${Math.round(tooltipItems.yLabel)} Average ${label} Watt-Hours`;
  };

  const tooltipTitle = (tooltipItems) => {
    const i = tooltipItems[0].index;
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][i];
  };

  const options = {
    legend: {
      display: true,
      position: "top",
      labels: {
        boxWidth: 10,
        fontSize: 10,
      },
    },
    hover: {
      mode: "nearest",
      intersect: true,
    },
    tooltips: {
      callbacks: {
        label: (tooltipItems) => tooltipLabelYear(tooltipItems),
        title: (tooltipItems) => tooltipTitle(tooltipItems),
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
