import React from "react";
import {
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

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

  const makeTooltip = value => {
    switch (value) {
      case "actual":
        return "Shows how much energy was used during each daily period";
      case "baseline":
        return "Shows how much energy was actively used during each daily period compared to passive usage (fridge, AC, network, IoT)";
      case "average":
        return "Shows the average energy being actively used during each daily period";
    }
  };

  const makeMenuItem = value => (
    <OverlayTrigger
      placement="left"
      overlay={<Tooltip>{makeTooltip(value)}</Tooltip>}
    >
      <Dropdown.Item eventKey={value}>{makeTitle(value)}</Dropdown.Item>
    </OverlayTrigger>
  );

  return (
    <DropdownButton
      size="sm"
      title={makeTitle(props.defaultValue)}
      onSelect={e => e != props.defaultValue && props.handleClick(e)}
    >
      {makeMenuItem("actual")}
      {makeMenuItem("baseline")}
      {makeMenuItem("average")}
    </DropdownButton>
  );
};

export default PartDropdown;
