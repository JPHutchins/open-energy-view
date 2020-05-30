import { List, Map } from "immutable";
import { zipWith } from "ramda";
import { Either } from "ramda-fantasy";
import { getTime } from "data-fns";
import groupBy from "../functions/groupBy";
import extract from "../functions/extract";
import removeOutliers from "../functions/removeOutliers";
import fastRollingMean from "../functions/fastRollingMean";
import makeFillWindow from "../functions/makeFillWindow";

export default function calculatePassiveUse(database) {
  const WINDOW = 14; // global config variable?

  const dailyMinimums = minOfEachDay(groupByDay(database));
  const values = Either.Right(extract("y")(dailyMinimums));
  const time = Either.Right(extract("x")(dailyMinimums));

  const passiveValues = values
    .chain(removeOutliers(WINDOW))
    .chain(fastRollingMean(WINDOW))
    .chain(makeFillWindow(WINDOW)(values.value)(meanOf));

  if (passiveValues.isLeft) return Either.Left(database);

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
 * List (Map) -> List (Map)
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
