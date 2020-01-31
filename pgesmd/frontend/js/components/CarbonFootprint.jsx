import React from "react";

const CarbonFootprint = props => {
  const carbon = Math.round((props.sum / 1000) * props.carbonMultiplier);

  return (
    <div>
      <div className="kilowatt-hour">{carbon}lbs carbon</div>
    </div>
  );
};

export default CarbonFootprint;
