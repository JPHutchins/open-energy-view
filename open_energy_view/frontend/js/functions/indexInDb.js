/**
 * List ( Map ) -> ( Number -> Number )
 *
 * Return the index of the time if found in the database, else return the insert
 * index.
 * @param {EnergyHistoryDB} database The EnergyHistory DB Immutable JS object.
 * @param {Number} msEpochTime The time in milliseconds since Linux epoch.
 */
export const indexInDb = (database) => (msEpochTime) => {
  const immutable = database.size != undefined ? true : false;
  const length = immutable ? database.size : database.length;

  let l = 0;
  let r = length - 1;
  let m = 0;

  while (l <= r) {
    m = Math.floor((l + r) / 2);
    const _current = immutable ? database.get(m).get("x") : database[m].x;
    if (msEpochTime === _current) return m;
    msEpochTime < _current ? (r = m - 1) : (l = m + 1);
  }

  const lastValue = immutable ? database.get(m).get("x") : database[m].x;

  return msEpochTime < lastValue ? m : m + 1;
};
