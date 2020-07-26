import React from "react";
import { format } from "date-fns";

const TopBar = ({ energyHistory }) => {
  const formatDate = (energyHistory) => {
    if (energyHistory.custom)
      return `${format(
        energyHistory.startDate,
        "EEEE, MMMM do, yyyy"
      )} - ${format(energyHistory.endDate, "EEEE, MMMM do, yyyy")}`;
    switch (energyHistory.windowData.windowSize) {
      case "day":
        return format(energyHistory.startDate, "EEEE, MMMM do, yyyy");
      case "week":
        return `Week of ${format(energyHistory.startDate, "MMMM do, yyyy")}`;
      case "month":
        return format(energyHistory.startDate, "MMMM yyyy");
      case "year":
        return format(energyHistory.startDate, "yyyy");
      case "complete":
        return `${format(energyHistory.startDate, "MMM do, yyyy")} - ${format(
          energyHistory.endDate,
          "MMMM do, yyyy"
        )}`;
      default:
        return `${format(energyHistory.startDate, "MMM do, yyyy")} - ${format(
          energyHistory.endDate,
          "MMM do, yyyy"
        )}`;
    }
  };

  return (
    <div>
      <h1>{energyHistory.friendlyName} Energy History</h1>
      <div className="energy-chart-header-container">
        <div id="window-date">{formatDate(energyHistory)}</div>
      </div>
    </div>
  );
};
export default TopBar;
