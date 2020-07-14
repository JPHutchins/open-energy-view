import React from "react";
import DatePicker from "react-datepicker";
import { format, isBefore, isAfter, subMilliseconds, sub, add } from "date-fns";
import { DropdownButton, Dropdown } from "react-bootstrap";
import "../../css/react-datepicker.css";


/**
 * The component to provide navigation of the data window.
 */
const LowerBar = ({ energyHistory, setEnergyHistory }) => {
  const disablePrev = () => {
    if (energyHistory.windowMode === "Complete") return true;
    return isBefore(
      subMilliseconds(energyHistory.startDate, 1),
      energyHistory.firstDate
    );
  };

  const disableNext = () => {
    if (energyHistory.windowMode === "Complete") return true;
    return isAfter(energyHistory.endDate, energyHistory.lastDate);
  };

  const startPickerMaxDate = () => {
    return energyHistory.windowMode === "Custom Range"
      ? energyHistory.endDate
      : energyHistory.lastDate;
  };

  const handleRangeChange = (startOrEnd) => (date) => {
    if (energyHistory.windowMode != "Custom Range") {
      setEnergyHistory(energyHistory.setDate(date));
      return;
    }
    if (startOrEnd === "start") {
      setEnergyHistory(
        energyHistory.setCustomRange(date, energyHistory.endDate)
      );
      return;
    }
    if (startOrEnd === "end") {
      setEnergyHistory(
        energyHistory.setCustomRange(energyHistory.startDate, date)
      );
      return;
    }
  };

  const handleWindowChange = (e) => {
    setEnergyHistory(energyHistory.setWindow({
      day: "Day",
      week: "Week",
      month: "Month",
      year: "Year",
      complete: "Complete",
      custom: "Custom Range",
    }[e]));
  };

  const buttonIntervalLabel = () => {
    switch (energyHistory.windowMode) {
      case "Day":
      case "Week":
      case "Month":
      case "Year":
        return ` ${energyHistory.windowMode}`;
      default:
        return "";
    }
  };

  const handleSizeWindow = ({ startOrEnd, addOrSub }) => {
    const startDateOrEndDate =
      startOrEnd === "start" ? energyHistory.startDate : energyHistory.endDate;
    const date = add(startDateOrEndDate, { days: addOrSub });
    handleRangeChange(startOrEnd)(date);
  };

  const handlePrevNextClick = (prevOrNext) => {
    if (energyHistory.windowMode === "Custom Range") return;

    if (prevOrNext === "prev") {
      setEnergyHistory(energyHistory.prev());
      return;
    }
    setEnergyHistory(energyHistory.next());
  };

  const disablePrevNextButton = (prevOrNext) => {
    if (energyHistory.windowMode === "Custom Range") return true;
    return prevOrNext === "prev" ? disablePrev() : disableNext();
  };

  const displayLeftRangeSelector = () => {
    if (energyHistory.windowMode != "Custom Range") return;
    return (
      <>
        <button
          onClick={() =>
            handleSizeWindow({ startOrEnd: "start", addOrSub: -1 })
          }
          className="btn btn-primary"
          disabled={energyHistory.windowMode != "Custom Range"}
        >
          {"\u2190"}
        </button>
        <button
          onClick={() => handleSizeWindow({ startOrEnd: "start", addOrSub: 1 })}
          className="btn btn-primary"
          disabled={energyHistory.windowMode != "Custom Range"}
        >
          {"\u2192"}
        </button>
      </>
    );
  };

  const displayRightRangeSelector = () => {
    if (energyHistory.windowMode != "Custom Range") return;
    return (
      <>
        <div className="datePickerWithScrollers">
          <DatePicker
            selected={energyHistory.endDate}
            onChange={(d) => handleRangeChange("end")(d)}
            selectsEnd={energyHistory.windowMode === "Custom Range"}
            startDate={energyHistory.startDate}
            endDate={energyHistory.endDate}
            dateFormat="MM/d/yyyy h:mma"
            disabled={energyHistory.windowMode != "Custom Range"}
            minDate={energyHistory.startDate}
            maxDate={energyHistory.lastDate}
            showYearDropdown
            showMonthDropdown
          />
          <button
            onClick={() =>
              handleSizeWindow({ startOrEnd: "end", addOrSub: -1 })
            }
            className="btn btn-primary"
            disabled={energyHistory.windowMode != "Custom Range"}
          >
            {"\u2190"}
          </button>
          <button
            onClick={() => handleSizeWindow({ startOrEnd: "end", addOrSub: 1 })}
            className="btn btn-primary"
            disabled={energyHistory.windowMode != "Custom Range"}
          >
            {"\u2192"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="container">
      <div className="box">
        <button
          onClick={() => handlePrevNextClick("prev")}
          className="btn btn-primary"
          disabled={disablePrevNextButton("prev")}
        >
          {`Previous ${buttonIntervalLabel()}`}
        </button>
        <button
          onClick={() => handlePrevNextClick("next")}
          className="btn btn-primary"
          disabled={disablePrevNextButton("next")}
        >
          {`Next ${buttonIntervalLabel()}`}
        </button>
        <DropdownButton
          title={energyHistory.windowMode}
          onSelect={(e) => handleWindowChange(e)}
        >
          <Dropdown.Item eventKey="day">Day</Dropdown.Item>
          <Dropdown.Item eventKey="week">Week</Dropdown.Item>
          <Dropdown.Item eventKey="month">Month</Dropdown.Item>
          <Dropdown.Item eventKey="year">Year</Dropdown.Item>
          <Dropdown.Item eventKey="complete">Complete</Dropdown.Item>
          <Dropdown.Item eventKey="custom">Custom Range</Dropdown.Item>
        </DropdownButton>
      </div>
      <div className="datePickers">
        <div className="datePickerWithScrollers">
          {displayLeftRangeSelector()}
          <DatePicker
            selected={energyHistory.startDate}
            onChange={(d) => handleRangeChange("start")(d)}
            selectsStart={energyHistory.windowMode === "Custom Range"}
            startDate={energyHistory.startDate}
            endDate={energyHistory.endDate}
            dateFormat="MM/d/yyyy h:mma"
            minDate={energyHistory.firstDate}
            maxDate={startPickerMaxDate()}
            showYearDropdown
            showMonthDropdown
          />
        </div>
        {displayRightRangeSelector()}
      </div>
    </div>
  );
};
export default LowerBar;
