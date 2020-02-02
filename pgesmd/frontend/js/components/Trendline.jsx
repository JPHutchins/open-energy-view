import React from "react";
import regression from "regression";
import Icon from "@mdi/react";
import {
  mdiArrowUpCircle,
  mdiArrowUp,
  mdiTrendingUp,
  mdiTrendingDown,
  mdiTrendingNeutral
} from "@mdi/js";

const average = arr => {
  return arr.reduce((acc, val) => acc + val, 0) / arr.length;
};

const squaredDiffs = avg => arr => {
  return arr.map(val => (val - avg) * (val - avg));
};

const std = arr => {
  return Math.sqrt(average(squaredDiffs(average(arr))(arr)));
};

const getKey = baseline => {
  return baseline ? "baseline" : "y";
};

const selectData = datatype => data => {
  let i = -1;
  if (datatype === "baseline") {
    return data.map(item => [(i += 1), item["baseline"]]);
  } else if (datatype === "y") {
    return data.map(item => [(i += 1), item["y"] - item["baseline"]]);
  }
};

const Trendline = props => {
  const calculateTrend = baseline => data => {
    if (!data) return;

    const datatype = getKey(baseline);
    const coords = selectData(datatype)(data);

    // Throw out data points that are outisde the standard deviation
    const coordsAvg = average(coords.map(x => x[1]));
    const coordsStd = std(coords.map(x => x[1]));
    const coordsSmooth = coords.filter(
      x => x[1] < coordsAvg + 2 * coordsStd && x[1] > coordsAvg - 2 * coordsStd
    );

    const trendline = regression.linear(coordsSmooth);
    const slope = trendline.equation[0];
    const intercept = trendline.equation[1];

    // Below we are finding the percent change from the given intercept
    // of the best fit trendline to the endpoint of the trendline.  This
    // measurement gives an estimation of the upward or downward trend in
    // usage during the entire period rather than the "interval over inter"
    const trend = Math.round(
      (100 * (slope * coordsSmooth.length + intercept)) / intercept - 100
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

    if (range === "year" || range === "complete") {
      return database
        .get("day")
        .slice(data[0].i_day_start, data[data.length - 1].i_day_end + 1)
        .toJS();
    }

    if (range === "month") return data;

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
  const upOrDown = percent => {
    const steepest = 50;
    const angle = percent => {
      return percent <= 0
        ? Math.max(percent, -steepest)
        : Math.min(percent, steepest);
    };
    console.log(percent);

    return 270 - (angle(percent) / steepest) * 90;
  };
  const greenOrOrange = percent <= 0 ? "green" : "orange";

  return (
    <>
      <div className="kilowatt-hour">{props.name}</div>
      <div className="info-details">Trending {aboveOrBelow} {perc + "%"}</div>
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
      <div className="info-details">{description(props.range)}</div>
    </>
  );
};

export default Trendline;
