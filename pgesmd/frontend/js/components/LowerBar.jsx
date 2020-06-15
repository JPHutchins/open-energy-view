import React from "react";
import CenterDate from "./CenterDate";
import { format } from "date-fns";
import { DropdownButton, Dropdown } from "react-bootstrap";

/**
 * The component to provide navigation of the data window.
 */
const LowerBar = ({ energyHistory, setEnergyHistory }) => {
  const formatDate = (energyHistory) => {
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
        return `${format(energyHistory.startDate, "MMM do, yy")} - ${format(
          energyHistory.endDate,
          "MMM do, yy"
        )}`;
      default:
        return `${format(energyHistory.startDate, "MMM do, yy")} - ${format(
          energyHistory.endDate,
          "MMM do, yy"
        )}`;
    }
  };

  return (
    <div className="container">
      <div id="window-date">{formatDate(energyHistory)}</div>
      <div className="box">
        <button
          onClick={() => setEnergyHistory(energyHistory.prev())}
          className="btn btn-primary"
          //disabled={disablePrev}
        >
          Previous
        </button>
        <button
          onClick={() => setEnergyHistory(energyHistory.next())}
          className="btn btn-primary"
          //disabled={disableNext}
        >
          Next
        </button>
        <DropdownButton
          title={energyHistory.windowData.windowSize}
          onSelect={(e) => setEnergyHistory(energyHistory.setWindow(e))}
        >
          <Dropdown.Item eventKey="day">Day</Dropdown.Item>
          <Dropdown.Item eventKey="week">Week</Dropdown.Item>
          <Dropdown.Item eventKey="month">Month</Dropdown.Item>
          <Dropdown.Item eventKey="year">Year</Dropdown.Item>
          <Dropdown.Item eventKey="complete">Complete</Dropdown.Item>
        </DropdownButton>
      </div>
    </div>
  );
};
export default LowerBar;
