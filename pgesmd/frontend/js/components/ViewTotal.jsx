import React from "react";

const ViewTotal = props => {
  const percent = Math.round((props.sum / 1000 / props.avg - 1) * 100);

  const aboveOrBelow = percent <= 0 ? "below" : "above";

  const upOrDown = percent <= 0 ? "arrow_downward" : "arrow_upward";

  const greenOrOrangeBg =
    percent <= 0 ? "background-green" : "background-orange";
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <div>
      <div className="kilowatt-hour">
        {Math.round(props.sum / 1000)}kWh{"\n"}
      </div>
      <div className={greenOrOrange + " kilowatt-hour"}>
        <i class="material-icons">{upOrDown}</i>
      </div>
      <div className="info-details">
        {Math.abs(percent)}% {aboveOrBelow} average
      </div>
    </div>
  );
};

export default ViewTotal;
