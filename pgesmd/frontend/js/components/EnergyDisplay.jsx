import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import LowerBar from "./LowerBar";

const EnergyDisplay = ({ energyHistoryInstance }) => {
  const [energyHistory, setEnergyHistory] = useState(energyHistoryInstance);

  return (
    <div className="energy-history">
      <div className="energy-history-main-div">
        <div className="energy-chart">
          <EnergyChart
            data={energyHistory.data}
            options={energyHistory.chartOptions}
          />
        </div>
      </div>

      <LowerBar
        energyHistory={energyHistory}
        setEnergyHistory={setEnergyHistory}
      />
    </div>
  );
};
export default EnergyDisplay;
