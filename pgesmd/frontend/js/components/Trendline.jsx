import React from "react";
import regression from "regression";
import Icon from "@mdi/react";
import { mdiArrowUp } from "@mdi/js";
import { sub } from "date-fns";
import { extract } from "../functions/extract";
import { groupBy } from "../functions/groupBy";
import { meanOf } from "../functions/meanOf";
import { standardDeviationOf } from "../functions/standardDeviationOf";

const Trendline = ({ energyHistory, activeOrPassive, name }) => {
  const calculateTrend = (data) => {
    if (!data) return;

    // incomplete periods of the window will be NaN
    data = data.filter((x) => !isNaN(x));

    // Throw out data points that are outisde the standard deviation
    const dataMean = meanOf(data);
    const dataStd = standardDeviationOf(data);
    const dataSmooth = data.map((x) =>
      x < dataMean + 2 * dataStd || x > dataMean - 2 * dataStd ? x : dataMean
    );

    // regression library needs coords in [x, y] format
    const dataSmoothCoords = dataSmooth.map((y, i) => [i, y]);

    const trendline = regression.linear(dataSmoothCoords);
    const slope = trendline.equation[0];
    const intercept = trendline.equation[1];

    // Below we are finding the percent change from the given intercept
    // of the best fit trendline to the endpoint of the trendline.  This
    // measurement gives an estimation of the upward or downward trend in
    // usage during the entire period rather than the "interval over inter"
    const trend = Math.round(
      (100 * (slope * dataSmooth.length + intercept)) / intercept - 100
    );
    return trend;
  };

  const defineDataset = (activeOrPassive, energyHistory) => {
    // The trend over the day and week views is useless as the window is
    // too small to be accurate and the trend simply gives an account of
    // recurring trends over the small time window.  Here we redefine the
    // dataset to the daily data of the preceeding two weeks (for range "day")
    // or to the daily data of the preceeding four weeks (for range "week").

    const getPrecedingDays = (numberOfDays) => {
      const startDate = sub(energyHistory.endDate, { days: numberOfDays });
      const endDate = energyHistory.endDate;
      const dataSlice = energyHistory.slice(startDate, endDate);
      const dailyData = groupBy("day")(dataSlice).map((x) =>
        meanOf(extract(activeOrPassive)(x))
      );
      return dailyData;
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
    }
  };

  const dataset = defineDataset(activeOrPassive, energyHistory);
  const percent = calculateTrend(dataset);
  const aboveOrBelow = percent <= 0 ? "down" : "up";
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
      <div className="info-details">
        Trending {aboveOrBelow} {Math.abs(percent) + "%"}
      </div>
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
