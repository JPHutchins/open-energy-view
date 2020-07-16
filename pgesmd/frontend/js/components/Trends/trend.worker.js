import { calculateTrend } from "./functions";
import { groupBy } from "../../functions/groupBy";
import { meanOf } from "../../functions/meanOf";

onmessage = function (e) {
  const { getArrayArgs, getRollingArrayArgs, cache } = e.data;

  if (cache) {
    postMessage(JSON.parse(cache));
    return;
  }

  const getArray = (slice, type) => {
    return slice.map((x) => ({
      x: x.x,
      y: x[type],
    }));
  };

  const getRollingArray = (slice, type, grouping, timeOffset = 0) => {
    return groupBy(grouping)(slice).map((x) => {
      return {
        x: x[timeOffset].x, // 12 to put the value at "noon"
        y: meanOf(x.map((y) => y[type])),
      };
    });
  };

  const rawData = getArrayArgs ? getArray(...getArrayArgs) : null;
  const rollingData = getRollingArray(...getRollingArrayArgs);

  const dataToUseForTrend = rawData ? rawData : rollingData;
  const linearRegressionData = dataToUseForTrend.map((x) => x.y);

  const groupedRawData =
    !rawData || rawData.length < 675
      ? rawData
      : groupBy("week")(rawData).map((x) => {
          return {
            x: x[0].x,
            y: meanOf(x.map((y) => y.y)),
          };
        });

  const { trendPercent, trendObject } = calculateTrend(linearRegressionData);
  postMessage({
    rollingData: rollingData,
    rawData: groupedRawData,
    trendPercent: trendPercent,
    trendPoints: [
      trendObject.points[0][1],
      trendObject.points[trendObject.points.length - 1][1],
    ],
  });
};
