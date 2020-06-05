import { add, isBefore, differenceInMilliseconds, setHours, format } from "date-fns";
import { endOf } from "./endOf";
import { findMaxResolution } from "./findMaxResolution";

// Refactor to composition

export function makeIntervalArray(energyHistory) {
  const _intervalLength = Math.abs(
    differenceInMilliseconds(energyHistory.startDate, energyHistory.endDate)
  );
  const _dataPointLength = findMaxResolution(_intervalLength);
  const intervalArray = [];
  const start = energyHistory.startDate;
  const end = energyHistory.endDate;
  if (_dataPointLength === "part") {
    const partHours = energyHistory.partitionOptions.value.map((x) => {
      return x.start;
    });
    const nextPart = (cur) => {
        const curHour = format(cur, "H")
      let i = 0;
      while (i < partHours.length && partHours[i] <= curHour) {
        i++;
      }
      const result =
        i < partHours.length
          ? setHours(cur, partHours[i])
          : setHours(add(cur, { days: 1 }), partHours[0]);
      return result;
    };
    let _start = new Date(start);
    while (isBefore(_start, end)) {
      intervalArray.push([_start, nextPart(_start)]);
      _start = nextPart(_start);
    }
    return intervalArray;
  }
  const _dateAddFormat = { [`${_dataPointLength}s`]: 1 };
  let _start = new Date(start);
  while (isBefore(_start, end)) {
    intervalArray.push([_start, endOf(_dataPointLength)(_start)]);
    _start = add(_start, _dateAddFormat);
  }
  return intervalArray;
}
