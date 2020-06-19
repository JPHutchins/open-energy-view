import React from "react";
import { Pie } from "react-chartjs-2";
import { sum } from "ramda";
import PartDropdown from "./PartDropdown";
import { readableWatts } from "../functions/readableWatts";

/**
 * Return a flexibly sized ChartJS pie chart.
 */
const MiniPie = ({ energyHistory }) => {
  const pieData = energyHistory.windowData.partitionSums.map((x) => x.sum);
  const labels = energyHistory.windowData.partitionSums.map((x) => x.name);
  const colors = energyHistory.partitionOptions.value.map((x) => x.color);

  const data = {
    datasets: [
      {
        data: pieData,
        backgroundColor: colors,
      },
    ],
    labels: labels,
  };

  const options = {
    maintainAspectRatio: true,
    aspectRatio: 1,
    legend: {
      display: false,
    },
    tooltips: {
      callbacks: {
        title: (tooltipItem) => {
          return data.labels[tooltipItem[0].index];
        },
        label: (tooltipItem) => {
          return (
            Math.round(
              (data.datasets[0].data[tooltipItem.index] /
                sum(data.datasets[0].data)) *
                100
            ) +
            "%" +
            "\n" +
            readableWatts(data.datasets[0].data[tooltipItem.index])
          );
        },
      },
    },
  };
  return (
    <div>
      <div className="kilowatt-hour">Activities</div>
      <Pie data={data} options={options} height={null} width={null} />
      {/* <PartDropdown
        handleClick={handlePartPieView}
        defaultValue={defaultValue}
        selected={selectedPartPieView}
      /> */}
    </div>
  );
};

export default MiniPie;
