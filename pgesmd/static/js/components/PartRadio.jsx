import React from "react";
import { Button, ToggleButtonGroup, ToggleButton } from "react-bootstrap";

const PartRadio = props => {
  return (
      <div>
    <ToggleButtonGroup
      name="name"
      size="sm"
      onChange={props.handleClick}
      defaultValue={props.defaultValue}
      block="true"
    >
      <ToggleButton className="Part-Pie-Radio" value="actual" name="actual">
        Actual
      </ToggleButton>
      <ToggleButton className="Part-Pie-Radio" value="baseline" name="baseline">
        Baseline
      </ToggleButton>
      <ToggleButton className="Part-Pie-Radio" value="average" name="average">
        Average
      </ToggleButton>
    </ToggleButtonGroup>
    </div>
  );
};

export default PartRadio;
