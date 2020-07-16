import React from "react";
import Trendline from "./Trends/Trendline";
import MiniPie from "./MiniPie";
import ViewTotal from "./ViewTotal";
import CarbonFootprint from "./CarbonFootprint";
import "../../css/App.css";
import AnnualTrend from "./AnnualTrend";

const RightBar = ({ energyHistory }) => {
  return (
    <div className="right-bar">
      <ViewTotal energyHistory={energyHistory} />
      <CarbonFootprint energyHistory={energyHistory} />
      <AnnualTrend energyHistory={energyHistory} />
      <MiniPie energyHistory={energyHistory} />
      <Trendline
        energyHistory={energyHistory}
        activeOrPassive="active"
        name="Active Use"
      />
      <Trendline
        energyHistory={energyHistory}
        activeOrPassive="passive"
        name="Passive Use"
      />
    </div>
  );
};
export default RightBar;
