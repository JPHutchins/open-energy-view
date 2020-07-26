import { compose, mean, map, sum } from "ramda";
import { groupBy } from "./groupBy";
import { extract } from "./extract";

export const alltimeMeanByDay = (windowSize) => (database) => {
  return compose(
    mean,
    map(sum),
    map(extract("y")),
    groupBy(windowSize)
  )(database);
};
