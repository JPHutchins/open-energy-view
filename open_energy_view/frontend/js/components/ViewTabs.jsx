import React, { useState } from "react";
import Dashboard from "./Dashboard/Dashboard";
import Patterns from "./Patterns/Patterns";
import Trends from "./Trends/Trends";
import Settings from "./Settings/Settings";
import EnergyDisplay from "./History/EnergyDisplay";
import { mdiGaugeLow } from "@mdi/js";
import { mdiChartBellCurve } from "@mdi/js";
import { mdiChartBar } from "@mdi/js";
import { mdiTrendingUp } from "@mdi/js";
import { mdiCogs } from "@mdi/js";
import Icon from "@mdi/react";
import { useEffect } from "react";
import {withRouter} from 'react-router';

const ViewTabs = ({ energyDisplayItem, restrictView, setSources, sources, setSelectedResource, setSelectedTab, selectedTab}) => {
  selectedTab = selectedTab ? selectedTab : 0
  const energyHistory = energyDisplayItem.component.props.energyHistoryInstance
  
  const views = [
    {
      title: "Dash",
      icon: (
        <Icon className="sidebar-icon" color="#5f5566" path={mdiGaugeLow} />
      ),
      component: <Dashboard energyHistory={energyHistory} />,
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
        <Patterns
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
          setSources={setSources}
          sources={sources}
          setSelectedResource={setSelectedResource}
        />
      ),
    },
    {
      title: "Settings",
      icon: <Icon className="sidebar-icon" color="#5f5566" path={mdiCogs} />,
      component: (
        <Settings energyHistory={energyHistory} restrictView={restrictView} />
      ),
    },
  ];


  /**
   * Set the State Variable selectedTab to the value attribute of the click event.
   *
   * @param {Object} e Event.
   */
  const handleClick = (e) => {
    energyDisplayItem.currentTab = parseInt(e.currentTarget.getAttribute("value"))
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
