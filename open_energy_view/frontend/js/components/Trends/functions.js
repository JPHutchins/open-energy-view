import regression from "regression";

export const calculateTrend = (data) => {
  if (!data) return;

  // incomplete periods of the window will be NaN
  data = data.filter((x) => !isNaN(x));

  // regression library needs coords in [x, y] format
  const dataSmoothCoords = data.map((y, i) => [i, y]);

  const trendObject = regression.linear(dataSmoothCoords);
  const slope = trendObject.equation[0];
  const intercept = trendObject.equation[1];

  // Below we are finding the percent change from the given intercept
  // of the best fit trendline to the endpoint of the trendline.  This
  // measurement gives an estimation of the upward or downward trend in
  // usage during the entire period rather than the "interval over inter"

  // TODO: this can be done with the "points" prop of trendObject instead
  const trendPercent = Math.round(
    (100 * (slope * data.length + intercept)) / intercept - 100
  );
  return {
    trendPercent: trendPercent,
    trendObject: trendObject,
  };
};

export const makeTrendDescription = (trendPercent) => {
  const aboveOrBelow = trendPercent <= 0 ? "down" : "up";
  return `Trending ${aboveOrBelow} ${Math.abs(trendPercent) + "%"}`;
};
