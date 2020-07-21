import React from "react";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { sum } from "ramda";
import { readableWattHours } from "../../functions/readableWattHours";
import { editHsl } from "../../functions/editHsl";

const CompleteHistoryLine = ({
  energyHistory,
  labelAxes = true,
  yTicksLimit = 5,
  xTicksLimit = 15,
}) => {
  const passiveColor = (x) => editHsl(x, { s: (s) => s / 2, l: (l) => l + 20 });
  const activeColor = (x) =>
    editHsl(x, {
      s: (s) => Math.min(100, s * 2),
      l: (l) => (l + 200) / 3,
    });
  energyHistory.data.datasets.map((x, i) => {
    x.type = "line";
    let colorEdit = (x) => x;
    if (i === 0) {
      x.fill = true;
      colorEdit = passiveColor;
    }
    if (i === 1) {
      x.fill = "-1";
    }
    if (i === 2) {
      x.fill = "-1";
      colorEdit = activeColor;
    }
    x.pointRadius = 0;
    x.borderColor = colorEdit("hsl(275, 9%, 37%)");
    x.backgroundColor = editHsl(x.borderColor, {
      s: (s) => s / 2,
      l: (l) => (l + 100) / 2,
    });
    return x;
  });

  const tooltipLabelYear = (tooltipItems) => {
    const labels = energyHistory.data.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    return `${readableWattHours(tooltipItems.yLabel)} ${label}`;
  };

  const tooltipTitle = (tooltipItems) => {
    const dataset = tooltipItems[0].datasetIndex;
    const i = tooltipItems[0].index;
    console.log(energyHistory.data.datasets[dataset]);
    const date = format(
      new Date(energyHistory.data.datasets[dataset].data[i].x),
      "MMMM yyyy"
    );
    const total = readableWattHours(
      sum(
        tooltipItems.map((x) => {
          return x.yLabel;
        })
      )
    );
    return `${date}\n${total} average total`;
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
          type: "time",
          distribution: "linear",
          bounds: "ticks",
          gridLines: {
            display: false,
            offsetGridLines: true,
          },
        },
      ],
      yAxes: [
        {
          stacked: true,
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
      <h4>Energy History</h4>
      <div className="pattern-chartJS-box">
        <Line data={energyHistory.data} options={options} />
      </div>
      <div className="pattern-week-labels-container">
        <div className="label-complete-history">
          <div>{format(energyHistory.firstDate, "MMM do, yyyy")}</div>
          <div>{format(energyHistory.lastDate, "MMM do, yyyy")}</div>
        </div>
      </div>
    </div>
  );
};
export default CompleteHistoryLine;
