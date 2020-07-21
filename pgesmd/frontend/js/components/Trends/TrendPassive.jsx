import React from "react";
import { Line } from "react-chartjs-2";
import { format } from "date-fns/esm";

const TrendPassive = ({ chartData }) => {
  const data = {
    //labels: new Array(679).fill("Jan"),
    datasets: [
      {
        data: chartData,
        label: "Day to Day Average",
        borderColor: "#5f5566",
        fill: false,
      },
    ],
  };

  console.log(data);

  const tooltipLabelYear = (tooltipItems) => {
    const labels = data.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    return `${Math.round(tooltipItems.yLabel)} ${label} Whs`;
  };

  const tooltipTitle = (tooltipItems) => {
    const date = new Date(tooltipItems[0].label);
    if (tooltipItems[0].datasetIndex === 0) {
      return format(date, "eeee, MMM do, ha");
    }
    return format(date, "eeee, MMM do");
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
        title: (tooltipItems) => tooltipTitle(tooltipItems),
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
    <div className="pattern-flex-1 wide-228">
      <h3>Active Usage</h3>
      <div className="pattern-chartJS-box square-228">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
export default TrendPassive;
