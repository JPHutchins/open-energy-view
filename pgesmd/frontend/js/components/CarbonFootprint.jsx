import React from "react";

/**
 * Returns a div displaying the lbs of carbon used during the view window.
 *
 * @param {Object} props React props.
 * @param {Number} props.sum Total energy in Watts for view window.
 * @param {Number} props.carbonMultiplier Utility provided estimated pounds of carbon per kWh of energy produced.
 */
const CarbonFootprint = props => {
  const carbon = Math.round((props.sum / 1000) * props.carbonMultiplier);

  return (
    <div>
      <div className="kilowatt-hour">{carbon}lbs carbon</div>
    </div>
  );
};

export default CarbonFootprint;
