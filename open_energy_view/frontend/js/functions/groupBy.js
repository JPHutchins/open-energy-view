import { getTime, add } from "date-fns";
import { prepend, slice } from "ramda";
import { toDateInterval } from "./toDateInterval";
import { indexInDb } from "./indexInDb";
import { startOf } from "./startOf";

export const groupBy = (windowSize) => (list) => {
  const immutable = list.size != undefined ? true : false;

  const length = immutable ? list.size : list.length;
  if (length <= 0) {
    return []; 
  }

  const guess = {
    hour: 4,
    day: 24,
    week: 168,
    month: 744,
    year: 8760,
  }[windowSize];

  const first = immutable
    ? new Date(list.first().get("x"))
    : new Date(list[0].x);

  const start = startOf(windowSize)(first);
  const endTime = getTime(add(start, toDateInterval(windowSize)));

  const endIndex = list[guess] === endTime ? guess : indexInDb(list)(endTime);

  return prepend(
    slice(0, endIndex, list),
    groupBy(windowSize)(list.slice(endIndex, length))
  );
};
