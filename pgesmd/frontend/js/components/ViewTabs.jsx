import React, { useState } from "react";
import PatternChart from "./PatternChart";

const ViewTabs = ({ energyDisplayComponent }) => {
  const [selectedTab, setSelectedTab] = useState(0); // always preselect first tab


  const views = [
    {
      title: "History",
      component: energyDisplayComponent,
    },
    {
      title: "Patterns",
      component: (
        <PatternChart
          energyHistory={energyDisplayComponent.props.energyHistoryInstance}
        />
      ),
    },
  ];

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
          {views[tabIndex].title}
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
        {views[tabIndex].title}
      </div>
    );
  };

  const tabs = [];
  for (let i = 0; i < views.length; i++) {
    tabs.push(makeTab(i));
  }

  return (
    <div className="sidebar-and-contents">
      <div className="sidebar-container">{tabs}</div>
      {views[selectedTab].component}
    </div>
  );
};
export default ViewTabs;
