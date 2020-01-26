import React from "react";
import regression from "regression";
import Icon from "@mdi/react";
import { mdiArrowUpCircle } from "@mdi/js";

const Trendline = props => {
  const calculateTrend = baseline => data => {
    if (!data) return;

    let datatype;
    baseline ? (datatype = "baseline") : (datatype = "y");

    let i = -1;
    const coords = data.map(item => [(i += 1), item[datatype]]);

    const trendline = regression.linear(coords);
    const slope = trendline.equation[0];
    const intercept = trendline.equation[1];

    // Below we are finding the percent change from the given intercept
    // of the best fit trendline to the endpoint of the trendline.  This
    // measurement gives an estimation of the upward or downward trend in
    // usage during the entire period rather than the "interval over inter"
    const trend = Math.round(
      (100 * (slope * coords.length + intercept)) / intercept - 100
    );

    return trend;
  };

  const defineDataset = database => range => data => {
    // The trend over the day and week views is useless as the window is
    // to small to be accurate and the trend simply gives an account of
    // recurring trends over the small time window.  Here we redefine the
    // dataset to the daily data of the preceeding two weeks (for range "day")
    // or to the daily data of the preceeding four weeks (for range "week").
    if (database === undefined) {
      return null;
    }

    if (range === "month" || range === "year" || range === "complete")
      return data;

    if (range === "week") {
      return database
        .get("day")
        .slice(data[data.length - 1].i_day - 28, data[data.length - 1].i_day)
        .toJS();
    }

    if (range === "day") {
      return database
        .get("day")
        .slice(data[0].i_day - 14, data[0].i_day + 1)
        .toJS();
    }
  };

  const description = range => {
    switch (range) {
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

  const percent = calculateTrend(props.baseline)(
    defineDataset(props.database)(props.range)(props.data)
  );
  const perc = Math.abs(percent);
  const aboveOrBelow = percent <= 0 ? "down" : "up";
  const upOrDown = percent <= 0 ? 0 : 180;
  const animation =
    percent <= 0 ? "rotate-arrow-upside-down" : "rotate-arrow-upside-up";
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <div className="info-wrapper">
      <div className="kilowatt-hour">{props.name}</div>
      <div className="info-details">Trending {aboveOrBelow} </div>
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
      <div className="info-details">{description(props.range)}</div>
    </div>
  );
};

export default Trendline;
