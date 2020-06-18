import React from "react";
import { truncateNumerals } from "../functions/truncateNumerals";

/**
 * Returns a div displaying the lbs of carbon used during the view window.
 *
 * @param {EnergyHistory} energyHistory The energyHistory instance.
 */
const CarbonFootprint = ({ energyHistory }) => {
  const carbon =
    (energyHistory.windowData.windowSum / 1000) *
    energyHistory.carbonMultiplier;
  return (
    <div>
      <div className="kilowatt-hour">
        {truncateNumerals(3)(carbon)}lbs carbon
      </div>
    </div>
  );
};

export default CarbonFootprint;
