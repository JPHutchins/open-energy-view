import React from "react";

const ViewTotal = props => {
  const percent = Math.round((props.sum / 1000 / props.avg - 1) * 100);
  const aboveOrBelow = percent <= 0 ? "below" : "above";

  return (
    <div>
      <div className="info-medium-number">
        {Math.round(props.sum / 1000)}kWh{"\n"}
      </div>
      <div className="info-details">
        {Math.abs(percent)}% {aboveOrBelow} average
      </div>
    </div>
  );
};

export default ViewTotal;
