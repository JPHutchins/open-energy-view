import React from "react";

import Icon from "@mdi/react";
import { mdiArrowUp } from "@mdi/js";
import { sub } from "date-fns";
import { extract } from "../../functions/extract";
import { calculateTrend, makeTrendDescription } from "../Trends/functions";
import { endOf } from "../../functions/endOf";

const Trendline = ({ energyHistory, activeOrPassive, name, customPeriodName=null }) => {
  const defineDataset = (activeOrPassive, energyHistory) => {
    // The trend over the day and week views is useless as the window is
    // too small to be accurate and the trend simply gives an account of
    // recurring trends over the small time window.  Here we redefine the
    // dataset to the daily data of the preceeding two weeks (for range "day")
    // or to the daily data of the preceeding four weeks (for range "week").

    const getPrecedingDays = (numberOfDays) => {
      const startDate = endOf("day")(
        sub(energyHistory.endDate, { days: numberOfDays })
      );
      const endDate = energyHistory.endDate;
      const dataSlice = energyHistory.slice(startDate, endDate);
      // TODO: confirm methodology - is it better to get the trend from the
      // daily mean or from the hourly data?
      // const dailyData = groupBy("day")(dataSlice).map((x) =>
      //   meanOf(extract(activeOrPassive)(x))
      // );
      // return dailyData;
      return extract(activeOrPassive)(dataSlice).toArray();
    };

    const getGraph = () => {
      if (activeOrPassive === "active")
        return energyHistory.activeGraph.map((x) => x.y);
      return energyHistory.passiveGraph.map((x) => x.y);
    };

    const windowSize = energyHistory.windowData.windowSize;

    if (windowSize === "year" || windowSize === "complete") return getGraph();
    if (windowSize === "month") return getGraph();
    if (windowSize === "week") return getPrecedingDays(28);
    if (windowSize === "day") return getPrecedingDays(14);
    if (windowSize === "custom") return getGraph();
  };

  const description = (windowSize) => {
    switch (windowSize) {
      case "day":
        return "last two weeks";
      case "week":
        return "last four weeks";
      case "month":
        return "this month";
      case "year":
        return "this year";
      case "complete":
        return "all time";
      case "custom":
        return customPeriodName ? customPeriodName : "this period";
    }
  };

  const dataset = defineDataset(activeOrPassive, energyHistory);
  const percent = calculateTrend(dataset).trendPercent;
  const upOrDown = (percent) => {
    const steepest = 50;
    const angle = (percent) => {
      return percent <= 0
        ? Math.max(percent, -steepest)
        : Math.min(percent, steepest);
    };
    return 270 - (angle(percent) / steepest) * 90;
  };
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <div>
      <div className="kilowatt-hour">{name}</div>
      <div className="info-details">{makeTrendDescription(percent)}</div>
      <div className="info-big-number">
        <Icon
          path={mdiArrowUp}
          title="User Profile"
          size={2}
          horizontal
          vertical
          rotate={upOrDown(percent)}
          color={greenOrOrange}
        />
      </div>
      <div className="info-details">
        {description(energyHistory.windowData.windowSize)}
      </div>
    </div>
  );
};

export default Trendline;
