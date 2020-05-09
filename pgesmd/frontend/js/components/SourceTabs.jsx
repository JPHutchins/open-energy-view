import React, { useState } from "react";
import EnergyHistory from "./EnergyHistory";
import SourceRegistration from "./SourceRegistration"

/**
 * Returns a tabbed container. Each tab may contain components passed in as props (TODO).
 *
 * @param {Object} props Props.
 */
const SourceTabs = props => {
  const [nTabs, setNTabs] = useState(5); // set to props.(length of tab list) after testing
  const [selectedTab, setSelectedTab] = useState(0); // always preselect first tab

  const demoChart = <EnergyHistory source="PG&E" />; // test
  const blankChart = <EnergyHistory source="None" />; //test
  const sourceTitle = ["PG&E", "Office UPS", "Dryer", "IoTaWatt", "Add New Source"];

  const testingList = [demoChart, blankChart, undefined, undefined, SourceRegistration()]; // can remove after testing
  //   setNTabs(2); // can remove after testing

  /**
   * Set the State Variable selectedTab to the value attribute of the click event.
   *
   * @param {Object} e Event.
   */
  const handleClick = e => {
    setSelectedTab(parseInt(e.currentTarget.getAttribute("value")));
  };

  const handleAddSource = e => {
      return true;
  }

  /**
   * Return a div with the className="tab" or className="tab-selected".
   * The tab is selected if tabIndex matches the State Variable selectedTab.
   *
   * @param {Number} tabIndex The index of the tab, ex. 0, 1, 2, 3 etc.
   */
  const makeTab = tabIndex => {
    if (tabIndex === selectedTab) {
      const last = tabIndex === nTabs ? "tab-selected-last" : "tab-selected";
      return (
        <div key={tabIndex} className={last} value={tabIndex} onClick={handleClick}>{sourceTitle[tabIndex]}</div>
      );
    }
    return (
      <div key={tabIndex} className="tab" value={tabIndex} onClick={handleClick}>
        {sourceTitle[tabIndex]}
      </div>
    );
  };

  const tabs = [];
  for (let i=0; i<nTabs; i++) {
    tabs.push(makeTab(i))
}

  return (
    <div className="source-tabs">
      <div className="tab-container">
        {tabs}
      </div>
      {testingList[selectedTab]}
    </div>
  );
};
export default SourceTabs;
