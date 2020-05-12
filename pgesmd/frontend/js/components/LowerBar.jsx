import React from "react";
import CenterDate from "./CenterDate";
import { DropdownButton, Dropdown } from "react-bootstrap";

/**
 * The component to provide navigation of the data window.
 */
const LowerBar = (props) => {
  return (
    <div className="container">
    <div id="window-date">{props.startDate}</div>
      <div className="box">
        <button
          onClick={() => props.onClick(-1)}
          className="btn btn-primary"
          disabled={props.disablePrev}
        >
          Previous
        </button>
        <button
          onClick={() => props.onClick(1)}
          className="btn btn-primary"
          disabled={props.disableNext}
        >
          Next
        </button>
        <DropdownButton title={props.range} onSelect={props.onChange}>
          <Dropdown.Item eventKey="Day">Day</Dropdown.Item>
          <Dropdown.Item eventKey="Week">Week</Dropdown.Item>
          <Dropdown.Item eventKey="Month">Month</Dropdown.Item>
          <Dropdown.Item eventKey="Year">Year</Dropdown.Item>
          <Dropdown.Item eventKey="Complete">Complete</Dropdown.Item>
        </DropdownButton>
      </div>
    </div>
  );
};
export default LowerBar;
