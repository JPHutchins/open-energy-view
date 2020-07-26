import React from "react";
import { differenceInHours } from "date-fns";
import { readableWattHours } from "../../functions/readableWattHours";

const ViewTotal = ({ energyHistory }) => {
  const smallerWindowSize = Math.min(
    differenceInHours(energyHistory.endDate, energyHistory.startDate),
    differenceInHours(energyHistory.endDate, energyHistory.firstDate),
    differenceInHours(energyHistory.lastDate, energyHistory.startDate)
  );
  const windowMean = energyHistory.hourlyMean * smallerWindowSize;
  const percent = Math.round(
    (energyHistory.windowData.windowSum / windowMean - 1) * 100
  );
  const aboveOrBelow = percent <= 0 ? "below" : "above";

  return (
    <div>
      <div className="info-medium-number">
        {readableWattHours(energyHistory.windowData.windowSum)}
      </div>
      <div className="info-details">
        {Math.abs(percent)}% {aboveOrBelow} average
      </div>
    </div>
  );
};

export default ViewTotal;
