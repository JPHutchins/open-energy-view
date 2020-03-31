import React from "react";
import EnergyHistory from "./EnergyHistory";

const SourceTabs = props => {
  const demoChart = <EnergyHistory source="PG&E" />;
  const blankChart = <EnergyHistory source="None" />;
  const tab = selected => {
    if (selected) return <div className="tab-selected" />;
    return <div className="tab-deselected" />;
  };

  return (
    <div className="source-tabs">
      {tab(true)}
      {tab(false)}
      {demoChart}
    </div>
  );
};

export default SourceTabs;
