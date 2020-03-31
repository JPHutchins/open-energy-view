import React from "react";
import EnergyHistory from "./EnergyHistory";

const SourceTabs = props => {
  const demoChart = <EnergyHistory source="PG&E" />;
  const blankChart = <EnergyHistory source="None" />;

  return <div className="source-tabs"> {demoChart} </div>;
};

export default SourceTabs;
