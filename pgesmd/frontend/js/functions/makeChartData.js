import { Map, List } from "immutable";
import { getTime } from "date-fns";
import { indexInDb } from "./indexInDb";
import { compose, mean } from "ramda";
import { extract } from "./extract";
import { meanOf } from "./meanOf";

export const makeChartData = (database) => (intervalArray) => {
  const indexOf = indexInDb(database);

  const data = intervalArray.map((point) => {
    const [_startTime, _endTime] = point;
    const _startIndex = indexOf(getTime(_startTime));
    const _endIndex = indexOf(getTime(_endTime) + 1);
    const _slice = database.slice(_startIndex, _endIndex);
    const _sum = _slice.reduce((a, v) => a + v.get("y"), 0);
    const _mean = Math.round(_sum / (_endIndex - _startIndex));
    return Map({
      active: Map({
        x: getTime(_startTime),
        y: _mean,
        sum: _sum,
        total: compose(meanOf, extract("total"))(_slice),
      }),
      passive: Map({
        x: getTime(_startTime),
        y: compose(meanOf, extract("passive"))(_slice),
      }),
    });
  });
  return List(data);
};
