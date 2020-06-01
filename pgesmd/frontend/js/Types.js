import {
  compose,
  addIndex,
  map,
  chain,
  sum,
  slice,
  range,
  prepend,
  reduce,
  pipe,
  zipWith,
  __,
} from "ramda";
import { differenceInMilliseconds, getTime, format, add, sub } from "date-fns";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import findMaxResolution from "./functions/findMaxResolution";
import { Map, List, first, toJS } from "immutable";




//unneeded
const findIntervalBounds = (intervalType) => (start, end = null) => {
  console.log(start, end);
  if (end) return { start: start, end: end };
  return {
    start: startOf(intervalType)(start),
    end: endOf(intervalType)(start),
  };
};

//unneeded
// makeIntervalBounds :: String -> Moment -> {k: v}
export const makeIntervalBounds = (intervalType) => (start, end = null) => {
  if (end) return { start: start, end: end };
  return {
    start: startOf(intervalType)(start),
    end: endOf(intervalType)(start),
  };
};

// dayBounds :: Moment -> {k: v}
export const dayBounds = makeIntervalBounds("day");






const partitionScheme = Either.Right([
  { name: "Night", start: 1, color: "#FF0000" },
  { name: "Day", start: 7, color: "#00FF00" },
  { name: "Evening", start: 18, color: "#0000FF" },
]);




















