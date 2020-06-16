import { compose, mean, map, sum } from "ramda";
import { groupBy } from "./groupBy";
import { extract } from "./extract";

export const alltimeMeanByDay = (database) => {
  return compose(mean, map(sum), map(extract("y")), groupBy("day"))(database);
};
