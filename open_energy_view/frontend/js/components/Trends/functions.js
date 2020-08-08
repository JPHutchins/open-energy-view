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

  // TODO: reality check - over very long periods let's set the first intercept
  // to some average of the the early datapoints and recalculate the slope
  // to the given ending intercept.  I have a dataset where the best fit is 
  // showing 900% increase over 4 years because it set the first intercept to
  // 50 instead of the 250 that is actually present.  In other words, for
  // how can the first point used to calculate the percent change * be lower
  // than it actually was * Answer - it should not be!
  // This could be applied to the ending intercept as well:
  // So startIntercept = max(startingAverage, startIntercept)
  //    endIntercept = min(endingAverage, endIntercept)
  // This should account for plateaus in the dataseet relatively well
  // Note that this proposes a percentage that DOES NOT MATCH the slope of 
  // the best fit trendline
  // RENAME THE METRIC? to increase / decrease rather than trend?
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
