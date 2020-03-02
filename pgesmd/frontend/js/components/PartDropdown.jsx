import React from "react";
import {
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";

/**
 * The dropdown for selecting how activity ("partition") data is displayed in the mini pie chart.
 *
 * @param {Object} props React props.
 * @param {Function} props.handleClick The callback function called on making a selection from the dropdown.
 * @param {String} props.defaultValue The preselected item of the dropdown.
 */
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

  /**
   * Return the dropdown items with tooltip overlays.
   *
   * @param {String} value The title and tooltip to create: "actual", "baseline", "average"
   */
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
