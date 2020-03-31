import React, { useState } from "react";
import EnergyHistory from "./EnergyHistory";

const SourceTabs = props => {
  const [nTabs, setNTabs] = useState(0); // set to props.(length of tab list) after testing
  const [selectedTab, setSelectedTab] = useState(0); // always preselect first tab

  const demoChart = <EnergyHistory source="PG&E" />; // test
  const blankChart = <EnergyHistory source="None" />; //test

  const testingList = [demoChart, blankChart]; // can remove after testing
//   setNTabs(2); // can remove after testing

  const handleClick = (e) => {
      setSelectedTab(parseInt(e.currentTarget.getAttribute('value')))
  }

  const tab = tabIndex => {
    if (tabIndex === selectedTab)
      return (
        <div
          className="tab tab-selected"
          value={tabIndex}
          onClick={handleClick}
        />
      );
    return <div className="tab" value={tabIndex} onClick={handleClick} />;
  };

  return (
    <div className="source-tabs">
      <div className="tab-container">
        {tab(0)}
        {tab(1)}
        {tab(2)}
        {tab(3)}
      </div>
      {testingList[selectedTab]}
    </div>
  );
};

export default SourceTabs;
