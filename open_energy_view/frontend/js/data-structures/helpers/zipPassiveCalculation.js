import { indexInDb } from "../../functions/indexInDb";
import { startOfDay, getTime } from "date-fns";
import { fromJS as toImmutableJSfromJS } from "immutable";

export const zipPassiveCalculation = (database, passiveUse, spikes) => {
  if (!database || !passiveUse || !spikes) return;
  if (database.length !== spikes.length) return;
  const zipped = [];

  for (let i = 0; i < database.length; i++) {
    const hour = database[i];
    const total = hour.total;

    const day = getTime(startOfDay(new Date(hour.x)));
    let passive = passiveUse[indexInDb(passiveUse)(day)].passive;
    passive = passive < total ? passive : total;
    
    const spike = spikes[i];
    const active = total - spike - passive;

    zipped.push({
      x: hour.x,
      active,
      passive,
      spike,
      total,
    });
  }
  return toImmutableJSfromJS(zipped);
};
