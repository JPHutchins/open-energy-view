import React from "react";
import { Bar } from "react-chartjs-2";
import SourceRegistration from "./SourceRegistration";

/**
 * Container for the primary data display - the "view window".
 */
const EnergyChart = ({ energyHistory }) => {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px",
        position: "relative",
        margin: "auto",
        height: "100%",
        width: "100%",
      }}
    >
      <Bar
        //ref="bargraph"
        data={energyHistory.data}
        options={energyHistory.chartOptions}
      />
    </div>
  );
};
export default EnergyChart;
