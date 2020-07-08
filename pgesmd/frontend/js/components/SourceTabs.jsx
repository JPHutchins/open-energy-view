import React, { useState } from "react";
import ViewTabs from "./ViewTabs";

/**
 * Returns a tabbed container. Each tab may contain components passed in as props (TODO).
 *
 * @param {Object} props Props.
 */
const SourceTabs = (props) => {
  const [nTabs, setNTabs] = useState(props.sources.length); // set to props.(length of tab list) after testing
  const [selectedTab, setSelectedTab] = useState(0); // always preselect first tab

  /**
   * Set the State Variable selectedTab to the value attribute of the click event.
   *
   * @param {Object} e Event.
   */
  const handleClick = (e) => {
    setSelectedTab(parseInt(e.currentTarget.getAttribute("value")));
  };

  /**
   * Return a div with the className="tab" or className="tab-selected".
   * The tab is selected if tabIndex matches the State Variable selectedTab.
   *
   * @param {Number} tabIndex The index of the tab, ex. 0, 1, 2, 3 etc.
   */
  const makeTab = (tabIndex) => {
    if (tabIndex === selectedTab) {
      return (
        <div
          key={tabIndex}
          className="tab tab-selected"
          value={tabIndex}
          onClick={handleClick}
        >
          {props.sources[tabIndex].title}
        </div>
      );
    }
    return (
      <div
        key={tabIndex}
        className="tab"
        value={tabIndex}
        onClick={handleClick}
      >
        {props.sources[tabIndex].title}
      </div>
    );
  };

  const tabs = [];
  for (let i = 0; i < nTabs; i++) {
    tabs.push(makeTab(i));
  }

  return (
    <div className="source-tabs">
      <div className="tab-container">{tabs}</div>
      <ViewTabs energyDisplayComponent={props.sources[0].component} />
    </div>
  );
};
export default SourceTabs;
