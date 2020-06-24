import { List } from "immutable";
import { indexInDb } from "../../functions/indexInDb";
import { startOfDay, getTime } from "date-fns";
import { compose } from "ramda";

export const makeBarGraphData = (database, passiveUse) => {
  //TODO: refactor - consider moving further up in composition?
  console.log(database, passiveUse);
  if (!database || !passiveUse) return;
  let zipped = List([]);

  const getFrom = (object) => (key) => object.get(key);
  const useKey = (key) => (object) => object.get(key);

  for (let i = 0; i < database.size; i++) {
    let hour = database.get(i);
    let day = getTime(startOfDay(new Date(hour.get("x"))));
    let passive = compose(
      useKey("y"),
      getFrom(passiveUse),
      indexInDb(passiveUse)
    )(day);

    passive = passive < hour.get("y") ? passive : hour.get("y");
    let active = hour.get("y") - passive

    let zip = hour.set("passive", passive);
    zip = zip.set("y", active);
    zip = zip.set("total", hour.get("y"))

    zipped = zipped.set(i, zip);
  }
  return zipped;
};
