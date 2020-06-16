import React from "react";

const ViewTotal = ({ energyHistory }) => {
  const percent = Math.round(
    (energyHistory.windowData.windowSum / energyHistory.alltimeMeanByDay - 1) *
      100
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
