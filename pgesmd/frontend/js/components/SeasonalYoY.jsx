import React from "react";
import Icon from "@mdi/react";
import { sub, add } from "date-fns";
import { sum } from "ramda";
import { extract } from "../functions/extract";
import { mdiArrowUpCircle } from "@mdi/js";

const SeasonalYoY = ({ energyHistory }) => {
  const getCurrentSlice = (energyHistory) => {
    //TODO: slightly inaccurate for week data; "off center"
    //TODO: verify methodology and add unit tests
    if (
      energyHistory.windowData.windowSize === "day" ||
      energyHistory.windowData.windowSize === "week"
    ) {
      return energyHistory.slice(
        sub(new Date(energyHistory.data.datasets[0].data[0].x), { days: 14 }),
        add(new Date(energyHistory.data.datasets[0].data[0].x), { days: 14 })
      );
    }
    return energyHistory.slice(energyHistory.startDate, energyHistory.endDate);
  };

  const currentSlice = getCurrentSlice(energyHistory);

  //TODO: test for which slice is smaller and only compare equally sized slices
  //  for example, see the yearly view of 2018
  //TODO: return hyphen if no annual data is available
  const oldSlice = energyHistory.slice(
    sub(new Date(currentSlice.first().get("x")), { years: 1 }),
    sub(new Date(currentSlice.last().get("x")), { years: 1 })
  );

  const currentSliceSum = sum(extract("y")(currentSlice));
  const oldSliceSum = sum(extract("y")(oldSlice));

  const percent = Math.round((currentSliceSum / oldSliceSum - 1) * 100);

  const perc = Math.abs(percent);
  const aboveOrBelow = percent <= 0 ? "less than" : "more than";
  const upOrDown = percent <= 0 ? 0 : 180;
  const animation =
    percent <= 0 ? "rotate-arrow-upside-down" : "rotate-arrow-upside-up";
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <div className="info-wrapper">
      <div className="kilowatt-hour">Annual Trend</div>
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
