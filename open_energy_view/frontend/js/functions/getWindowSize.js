import { differenceInMilliseconds } from "date-fns";
import { findMaxResolution } from "./findMaxResolution";
import { intervalToWindow } from "./intervalToWindow";
import { compose } from "ramda";

export const getWindowSize = (startDate, endDate) => {
  return compose(
    intervalToWindow,
    findMaxResolution,
    differenceInMilliseconds
  )(startDate, endDate);
};
