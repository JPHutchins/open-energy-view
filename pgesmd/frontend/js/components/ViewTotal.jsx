import React from "react";
import { differenceInHours } from "date-fns";

const ViewTotal = ({ energyHistory }) => {
  const windowMean =
    energyHistory.hourlyMean *
    differenceInHours(energyHistory.endDate, energyHistory.startDate);
  const percent = Math.round(
    (energyHistory.windowData.windowSum / windowMean - 1) * 100
  );
  const aboveOrBelow = percent <= 0 ? "below" : "above";

  return (
    <div>
      <div className="info-medium-number">
        {Math.round(energyHistory.windowData.windowSum / 1000)}kWh{"\n"}
      </div>
      <div className="info-details">
        {Math.abs(percent)}% {aboveOrBelow} average
      </div>
    </div>
  );
};

export default ViewTotal;
