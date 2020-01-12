import React from "react";
import Icon from "@mdi/react";
import { mdiArrowUpCircle } from "@mdi/js";

const SeasonalYoY = props => {
  const percent = props.yoy;
  const perc = Math.abs(props.yoy);
  const aboveOrBelow = percent <= 0 ? "less than" : "more than";
  const upOrDown = percent <= 0 ? 0 : 180;
  const animation =
    percent <= 0 ? "rotate-arrow-upside-down" : "rotate-arrow-upside-up";
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <div className="info-wrapper">
      <div className="kilowatt-hour">Seasonal Trend</div>
      <div className="info-big-number">
        {perc + "%"}
        <Icon
          className={animation}
          path={mdiArrowUpCircle}
          title="User Profile"
          size={2}
          horizontal
          vertical
          rotate={upOrDown}
          color={greenOrOrange}
        />
      </div>
      <div className="info-details">{aboveOrBelow} last year</div>
    </div>
  );
};

export default SeasonalYoY;
