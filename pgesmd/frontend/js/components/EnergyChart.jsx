import React from "react";
import { Bar } from "react-chartjs-2";
import SourceRegistration from "./SourceRegistration";

/**
 * Container for the primary data display - the "view window".
 */
const EnergyChart = ({ energyHistory }) => {
  return (
    <div className="energy-history-flex">
      <Bar data={energyHistory.data} options={energyHistory.chartOptions} />
    </div>
  );
};
export default EnergyChart;
