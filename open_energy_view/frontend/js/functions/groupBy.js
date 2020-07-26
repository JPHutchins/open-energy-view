import { getTime, add } from "date-fns";
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

  const findIndex = indexInDb(list);

  const groups = [];
  let startIndex = 0;
  while (startIndex < length) {
    const first = immutable
      ? new Date(list.get(startIndex).get("x"))
      : new Date(list[startIndex].x);

    const start = startOf(windowSize)(first);
    const endTime = getTime(add(start, toDateInterval(windowSize)));

    const guessIndex = Math.min(startIndex + guess, length - 1);
    const guessEndTime = immutable
      ? list.get(guessIndex).get("x")
      : list[guessIndex].x;

    const endIndex = guessEndTime === endTime ? guessIndex : findIndex(endTime);

    groups.push(list.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  return groups;
};
