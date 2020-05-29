import { Either } from "ramda-fantasy";
import { add, isBefore, differenceInMilliseconds } from "date-fns";
import endOf from "./endOf";
import findMaxResolution from "./findMaxResolution";

// Refactor to composition

export default function makeIntervalArray(window) {
  const _intervalLength = Math.abs(
    differenceInMilliseconds(window.start, window.end)
  );
  const _dataPointLength = findMaxResolution(_intervalLength);

  const intervalArray = [];
  const { start, end } = window;
  if (_dataPointLength === "part") {
    console.error("Partitions not implemented");
    return Either.Left("Partitions not implemented");
  }
  const _dateAddFormat = { [`${_dataPointLength}s`]: 1 };
  let _start = new Date(start);
  while (isBefore(_start, end)) {
    intervalArray.push([_start, endOf(_dataPointLength)(_start)]);
    _start = add(_start, _dateAddFormat);
  }
  return intervalArray;
}
