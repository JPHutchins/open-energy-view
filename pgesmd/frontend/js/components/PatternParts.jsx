import React from "react";
import { Line } from "react-chartjs-2";

const PatternParts = ({ yLabelWidth, yearParts }) => {
  const dataYear = {
    labels: new Array(52).fill("Jan"),
    datasets: yearParts,
  };

  const tooltipLabelYear = (tooltipItems) => {
    const labels = dataYear.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    const percentBelowThisData =
      tooltipItems.datasetIndex === 0
        ? 0
        : dataYear.datasets[tooltipItems.datasetIndex - 1].data[
            tooltipItems.index
          ];
    return `${Math.round(tooltipItems.yLabel - percentBelowThisData)}% ${label}`;
  };

  const options = {
    legend: {
      display: true,
      onClick: (e) => e.stopPropagation(),
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
            max: 100,
            maxTicksLimit: 5,
          },
        },
      ],
    },
  };

  return <Line data={dataYear} options={options} />;
};
export default PatternParts;
