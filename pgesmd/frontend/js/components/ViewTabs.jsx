import React, { useState } from "react";
import PatternChart from "./PatternChart";
import Trends from "./Trends/Trends";
import EnergyDisplay from "./EnergyDisplay";
import { mdiGaugeLow } from "@mdi/js";
import { mdiChartBellCurve } from "@mdi/js";
import { mdiChartBar } from "@mdi/js";
import { mdiTrendingUp } from "@mdi/js";
import { mdiCogs } from "@mdi/js";
import Icon from "@mdi/react";

const ViewTabs = ({ energyDisplayItem }) => {
  const [selectedTab, setSelectedTab] = useState(0); // always preselect first tab
  const [energyHistory, setEnergyHistory] = useState(
    energyDisplayItem.component.props.energyHistoryInstance
  );

  const views = [
    {
      title: "Dashboard",
      icon: (
        <Icon className="sidebar-icon" color="#5f5566" path={mdiGaugeLow} />
      ),
      component: <>Dashboard</>,
    },
    {
      title: "Patterns",
      icon: (
        <Icon
          className="sidebar-icon"
          color="#5f5566"
          path={mdiChartBellCurve}
        />
      ),
      component: (
        <PatternChart
          energyHistory={
            energyDisplayItem.component.props.energyHistoryInstance
          }
        />
      ),
    },
    {
      title: "Trends",
      icon: (
        <Icon className="sidebar-icon" color="#5f5566" path={mdiTrendingUp} />
      ),
      component: (
        <Trends
          energyHistory={
            energyDisplayItem.component.props.energyHistoryInstance
          }
        />
      ),
    },
    {
      title: "History",
      icon: (
        <Icon className="sidebar-icon" color="#5f5566" path={mdiChartBar} />
      ),
      component: (
        <EnergyDisplay
          energyHistory={energyHistory}
          setEnergyHistory={setEnergyHistory}
        />
      ),
    },
    {
      title: "Settings",
      icon: <Icon className="sidebar-icon" color="#5f5566" path={mdiCogs} />,
      component: <>Settings</>,
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
        <div className="tab-box" key={tabIndex}>
          <div
            className="tab tab-selected"
            value={tabIndex}
            onClick={handleClick}
          >
            {views[tabIndex].icon}
            {views[tabIndex].title}
          </div>
        </div>
      );
    }
    return (
      <div className="tab-box" key={tabIndex}>
        <div className="tab" value={tabIndex} onClick={handleClick}>
          {views[tabIndex].icon}
          {views[tabIndex].title}
        </div>
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
