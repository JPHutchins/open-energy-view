import { List } from "immutable";
import { indexInDb } from "../../functions/indexInDb";
import { startOfDay, getTime } from "date-fns";
import { compose } from "ramda";

export const makeBarGraphData = (database, passiveUse) => {
  //TODO: refactor - consider moving further up in composition?
  //Rename this function?
  if (!database || !passiveUse) return;
  const zipped = [];

  const getFrom = (object) => (key) => object.get(key);
  const useKey = (key) => (object) => object.get(key);

  for (let i = 0; i < database.size; i++) {
    const hour = database.get(i);
    const day = getTime(startOfDay(new Date(hour.get("x"))));

    const total = hour.get("y");

    let passive = compose(
      useKey("y"),
      getFrom(passiveUse),
      indexInDb(passiveUse)
    )(day);

    passive = passive < total ? passive : total;
    const active = total - passive;

    const zip = hour.withMutations((hour) => {
      hour.set("passive", passive).set("y", active).set("total", hour.get("y"));
    });
   
    zipped.push(zip)
  }
  return List(zipped);
};
