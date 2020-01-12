import React from "react";

const CarbonFootprint = props => {
  const carbon = Math.round((props.sum / 1000) * props.carbonMultiplier);

  return (
    <div>
      <div className="kilowatt-hour">Carbon Footprint</div>
      <div className="info-medium-number">{carbon}lbs</div>
    </div>
  );
};

export default CarbonFootprint;
