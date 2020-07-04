import { getTime, add } from "date-fns";
import { prepend, slice } from "ramda";
import { toDateInterval } from "./toDateInterval";
import { indexInDb } from "./indexInDb";
import { startOf } from "./startOf"

export const groupBy = (windowSize) => (list) => {
  if (list.size <= 0) {
    return [];
  }

  const guess = {
    hour: 4,
    day: 24,
    week: 168,
    month: 744,
    year: 8760,
  }[windowSize];

  const start = startOf(windowSize)(new Date(list.first().get("x")));
  const endTime = getTime(add(start, toDateInterval(windowSize)));

  const endIndex = list[guess] === endTime ? guess : indexInDb(list)(endTime);

  return prepend(
    slice(0, endIndex, list),
    groupBy(windowSize)(list.slice(endIndex, list.size))
  );
};
