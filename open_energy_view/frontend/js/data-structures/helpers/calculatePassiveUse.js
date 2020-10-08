import { List, Map } from "immutable";
import { zipWith } from "ramda";
import { Either } from "ramda-fantasy";
import { getTime } from "date-fns";
import { groupBy } from "../../functions/groupBy";
import { extract } from "../../functions/extract";
import { removeOutliers } from "../../functions/removeOutliers";
import { fastRollingMean } from "../../functions/fastRollingMean";
import { makeFillWindow } from "../../functions/makeFillWindow";
import { startOf } from "../../functions/startOf";
import { minOf } from "../../functions/minOf";
import { meanOf } from "../../functions/meanOf";

export function calculatePassiveUse(database) {
  const WINDOW = 14; // days; global config variable?

  const dailyMinimums = minOfEachDayArray(groupByDay(database));
  const values = Either.Right(dailyMinimums.map((day) => day.min));
  const time = Either.Right(dailyMinimums.map((day) => day.x));

  const passiveValues = values
    .map(removeOutliers(WINDOW))
    .map(fastRollingMean(WINDOW))
    .map(makeFillWindow(WINDOW)(values.value)(meanOf));

  if (passiveValues.isLeft) return passiveValues;

  return Either.Right(
    zipWith(
      (x, y) => ({ x: x, passive: y }),
      time.value,
      passiveValues.value
    )
  );
}

/**
 * List[ Map ] -> List[ List[ Map ] ]
 */
function groupByDay(database) {
  return groupBy("day")(database);
}

/**
 * List[ Map ] -> List[ Map ]
 *
 * @param {List} list The ImmutableJS EnergyDatabase.
 */
function minOfEachDay(list) {
  return list.map((x) =>
    Map({
      x: getTime(startOf("day")(x.get(0).get("x"))),
      min: minOf(extract("total")(x)),
    })
  );
}

function minOfEachDayArray(array) {
  return array.map((day) => ({
    x: getTime(startOf("day")(day[0].x)),
    min: minOf(day.map((entry) => entry.total)),
  }));
}

/*

Statistic methodology

Get rolling mean of minOfEach(day)
Get rolling std of minOfEach(day)

Get removeOutliers - throwout values from minOfEach(day) that deviate from the
rolling mean by more than the standard deviation - replace with the mean.

Get rolling mean after removingOutliers

Composition:
[Number] -> [Number] -> [Number]
rollingMean(
    removeOutliers(rollingMean(minOfEach(day)),
    rollingStd(minOfEach(day)))
)

*/
