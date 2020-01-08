import React from "react";
import { Dropdown, DropdownButton, ButtonGroup } from "react-bootstrap";

const PartDropdown = props => {
  const makeTitle = value => {
    switch (value) {
      case "actual":
        return "Total";
      case "baseline":
        return "Activity";
      case "average":
        return "Average Activity";
    }
  };

  return (
    <DropdownButton
      size="sm"
      title={makeTitle(props.defaultValue)}
      onSelect={e => e != props.defaultValue && props.handleClick(e)}
    >
      <Dropdown.Item eventKey="actual">Total</Dropdown.Item>
      <Dropdown.Item eventKey="baseline">Activity</Dropdown.Item>
      <Dropdown.Item eventKey="average">Average Activity</Dropdown.Item>
    </DropdownButton>
  );
};

export default PartDropdown;
