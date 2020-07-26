import React from "react";
import Icon from "@mdi/react";
import { sub, add, isBefore } from "date-fns";
import { sum } from "ramda";
import { extract } from "../../functions/extract";
import { mdiArrowUpCircle } from "@mdi/js";

const AnnualTrend = ({ energyHistory }) => {
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

  if (currentSlice.size === 0) return <div></div>;

  const oneYearBeforeStart = sub(new Date(currentSlice.first().get("x")), {
    years: 1,
  });

  // oldStart cannot be before the firstDate available
  const oldStart = isBefore(oneYearBeforeStart, energyHistory.firstDate)
    ? energyHistory.firstDate
    : oneYearBeforeStart;
  const oldEnd = sub(new Date(currentSlice.last().get("x")), { years: 1 });
  const oldSlice = energyHistory.slice(oldStart, oldEnd);

  // recalculate the current slice to account for possible changes to oldStart
  const adjustedCurrentSlice = energyHistory.slice(
    add(oldStart, { years: 1 }),
    add(oldEnd, { years: 1 })
  );

  const currentSliceSum = sum(extract("total")(adjustedCurrentSlice));
  const oldSliceSum = sum(extract("total")(oldSlice));

  const percent = Math.round((currentSliceSum / oldSliceSum - 1) * 100);
  const aboveOrBelow = percent <= 0 ? "less than" : "more than";
  const upOrDown = percent <= 0 ? 0 : 180;
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  const arrowIcon = (
    <Icon
      path={mdiArrowUpCircle}
      title="User Profile"
      size={2}
      horizontal
      vertical
      rotate={upOrDown}
      color={greenOrOrange}
    />
  );

  return (
    <div className="info-wrapper">
      <div className="kilowatt-hour">Annual Trend</div>
      <div className="info-big-number">
        {isNaN(Math.abs(percent)) ? "-" : Math.abs(percent) + "%"}
        {isNaN(Math.abs(percent)) ? "" : arrowIcon}
      </div>
      <div className="info-details">{aboveOrBelow} last year</div>
    </div>
  );
};

export default AnnualTrend;
