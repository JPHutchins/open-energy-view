import { Map, List } from "immutable";
import { getTime } from "date-fns";
import { indexInDb } from "./indexInDb";
import { compose, sum } from "ramda";
import { extract } from "./extract";
import { meanOf} from "./meanOf";

export const makeChartData = (database) => (intervalArray) => {
  const indexOf = indexInDb(database);

  const data = intervalArray.map((point) => {
    const [_startTime, _endTime] = point;
    const _startIndex = indexOf(getTime(_startTime));
    const _endIndex = indexOf(getTime(_endTime) + 1);
    const _slice = database.slice(_startIndex, _endIndex);
    return Map({
      x: getTime(_startTime),
      active: compose(meanOf, extract("active"))(_slice),
      passive: compose(meanOf, extract("passive"))(_slice),
      total: compose(meanOf, extract("total"))(_slice),
      sum: sum(extract("total")(_slice)) 
    });
  });
  return List(data);
};
