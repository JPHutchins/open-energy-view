/**
 * List ( Map ) -> Number
 *
 * Return the index of the time if found in the database, else return the
 * correct insert index.
 * @param {EnergyHistoryDB} database The EnergyHistory DB Immutable JS object.
 * @param {Number} msEpochTime The time in milliseconds since Linux epoch.
 */
export const indexInDb = (database) => (msEpochTime) => {
  let l = 0;
  let r = database.size - 1;
  let m = 0;

  while (l <= r) {
    m = Math.floor((l + r) / 2);
    const _current = database.get(m).get("x");
    if (msEpochTime === _current) return m;
    msEpochTime < _current ? (r = m - 1) : (l = m + 1);
  }

  return msEpochTime < database.get(m).get("x") ? m : m + 1;
};
