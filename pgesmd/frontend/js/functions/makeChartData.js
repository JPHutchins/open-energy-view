import { Map, List } from "immutable";
import { getTime } from "date-fns";
import { indexInDb } from "./indexInDb";

export const makeChartData = (database) => (intervalArray) => {
  const indexOf = indexInDb(database);

  const data = intervalArray.map((point) => {
    const [_startTime, _endTime] = point;
    const _startIndex = indexOf(getTime(_startTime));
    const _endIndex = indexOf(getTime(_endTime));
    const _slice = database.slice(_startIndex, _endIndex);
    const _sum = _slice.reduce((a, v) => a + v.get("y"), 0);
    const _mean = Math.round(_sum / (_endIndex - _startIndex));
    return Map({
      x: getTime(_startTime),
      y: _mean,
      sum: _sum,
    });
  });
  return List(data);
};
