import React from "react";
import { Line } from "react-chartjs-2";

const TrendSmooth = ({ dataset, smooth }) => {
  const data = {
    //labels: new Array(679).fill("Jan"),
    datasets: [
      {
        data: dataset,
        type: "scatter",
      },
      {data: smooth}
    ],
  };

  console.log(data);

  const tooltipLabelYear = (tooltipItems) => {
    const labels = data.datasets.map((x) => x.label);
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
        radius: 2,
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
          type: "time",
        },
      ],
      yAxes: [
        {
          ticks: {
            min: 0,
            maxTicksLimit: 5,
          },
        },
      ],
    },
  };

  return (
    <div className="pattern-flex-1">
      <h3>Yearly Energy Pattern</h3>
      <div className="pattern-chartJS-box">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
export default TrendSmooth;
