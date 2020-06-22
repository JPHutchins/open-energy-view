import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import LowerBar from "./LowerBar";
import RightBar from "./RightBar";

const EnergyDisplay = ({ energyHistoryInstance }) => {
  const [energyHistory, setEnergyHistory] = useState(energyHistoryInstance);

  return (
    <div className="energy-history">
      <div className="energy-history-main-div">
        <div className="energy-chart">
          <EnergyChart energyHistory={energyHistory} />
        </div>
        <RightBar
          energyHistory={energyHistory}
          /*database={this.database}
          data={this.state.data.datasets}
          sum={this.getSum()}
          avg={this.getAllTimeAvg()}
          carbonMultiplier={this.state.carbonMultiplier}
          yoy={this.getYoyChange()}
          pieData={this.getPieData()}
          pieOptions={this.getPieOptions(this.getPieData())}
          defaultValue={this.state.partPieView}
          handlePartPieView={this.handlePartPieView}
          selectedPartPieView={this.state.partPieView}
          range={this.state.range}*/
        />
      </div>

      <LowerBar
        energyHistory={energyHistory}
        setEnergyHistory={setEnergyHistory}
      />
    </div>
  );
};
export default EnergyDisplay;
