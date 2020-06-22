import { concat } from "ramda";
import { indexInDb } from "./indexInDb";

/**
 * (List (Map), Number, Number) -> [k: v]
 *
 * Return the slice of passiveUse for the current view window.  It is necessary
 * to duplicate the last value of the array to the endpoint of the window.  For
 * example if we are viewing one day then the passiveUse line graph array will
 * need the value for that day printed at 12AM and 11.59.59.59... PM so that it
 * is clearly shown that the value is for the entire day.
 *
 * @param {ImmutableJS} passiveUse The PassiveUse object.
 * @param {Number} startDateMs Window start.
 * @param {Number} endDateMs Window end.
 */
export const slicePassive = (passiveUse, startDateMs, endDateMs) => {
  const passiveUseSlice = passiveUse
    .slice(indexInDb(passiveUse)(startDateMs), indexInDb(passiveUse)(endDateMs))
    .toJS();

  if (passiveUseSlice.length === 0) return;

  const interval = 86400000; // ms in day; passive use is always per day

  const lastValue = {
    x: passiveUseSlice[passiveUseSlice.length - 1].x + interval - 3600000,
    y: passiveUseSlice[passiveUseSlice.length - 1].y,
  };

  const passiveUseGraph = concat(passiveUseSlice, [lastValue]);

  return passiveUseGraph;
};
