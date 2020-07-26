import { compose } from "ramda";
import { makeChartData } from "../../functions/makeChartData";
import { makeIntervalArray } from "../../functions/makeIntervalArray";

/**
 * EnergHistoryDB -> Function
 *
 * @param {EnergyHistoryDB} database The EnergyHistoryDB object.
 */
export function getDataset(database) {
  return compose(makeChartData(database), makeIntervalArray);
}
