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
  const WINDOW = 14; // global config variable?

  const dailyMinimums = minOfEachDay(groupByDay(database));
  const values = Either.Right(extract("y")(dailyMinimums));
  const time = Either.Right(extract("x")(dailyMinimums));

  const passiveValues = values
    .chain(removeOutliers(WINDOW))
    .map(fastRollingMean(WINDOW))
    .chain(makeFillWindow(WINDOW)(values.value)(meanOf));

  if (passiveValues.isLeft) return passiveValues;

  return List(
    zipWith((x, y) => Map({ x: x, y: y }), time.value, passiveValues.value)
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
      y: minOf(extract("y")(x)),
    })
  );
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
