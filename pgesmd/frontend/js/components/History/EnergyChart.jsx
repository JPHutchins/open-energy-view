import React from "react";
import { Bar } from "react-chartjs-2";

/**
 * Container for the primary data display - the "view window".
 */
const EnergyChart = ({
  energyHistory,
  labelAxes = true,
  yTicksLimit = undefined,
  xTicksLimit = undefined,
}) => {
  energyHistory.chartOptions.scales.xAxes[0].scaleLabel.display = labelAxes;
  energyHistory.chartOptions.scales.yAxes[0].scaleLabel.display = labelAxes;

  energyHistory.chartOptions.scales.xAxes[0].ticks.maxTicksLimit = xTicksLimit;
  energyHistory.chartOptions.scales.yAxes[0].ticks.maxTicksLimit = yTicksLimit;

  return (
    <div className="energy-history-flex">
      <Bar data={energyHistory.data} options={energyHistory.chartOptions} />
    </div>
  );
};
export default EnergyChart;
