import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import TopBar from "./TopBar";
import LowerBar from "./LowerBar";
import RightBar from "./RightBar";

const EnergyDisplay = ({ energyHistory, setEnergyHistory }) => {
  return (
    <div className="energy-history">
      <div className="energy-history-main-div">
        <div className="energy-chart">
          <TopBar energyHistory={energyHistory} />
          <EnergyChart energyHistory={energyHistory} />
          <LowerBar
            energyHistory={energyHistory}
            setEnergyHistory={setEnergyHistory}
          />
        </div>
        <RightBar energyHistory={energyHistory}/>
      </div>
    </div>
  );
};
export default EnergyDisplay;
