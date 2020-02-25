export const checkDisableScroll = (data, database, direction) => {
  const type = data[0].type;

  if (direction === "next") {
    const lastEntry = database
      .get("lookup")
      .get(type)
      .get(data[data.length - 1].interval_start.toString());
    return lastEntry >= database.get(type).size - 1;
  } else if (direction === "prev") {
    const firstEntry = database
      .get("lookup")
      .get(type)
      .get(data[0].interval_start.toString());
    return firstEntry <= 0;
  }
};

/**
 * Get the index of the interval specified by type and startDate.
 *
 * @param {ImmutableJSMapsAndLists} database The ImmutableJS representation of the database.
 * @param {string} type The type of interval.
 * @param {number} startDate The date in seconds since Unix epoch.
 */
export const getLo = (database, type, startDate) => {
  return database
    .get("lookup")
    .get(type)
    .get(startDate.toString());
};

export const getHi = (database, type, endDate) => {
  return database
    .get("lookup")
    .get(type)
    .get(endDate.toString());
};

/**
 * Return JSON slice of database of the specified type between index lo and hi.
 *
 * @param {ImmutableJSMapsAndLists} database The ImmutableJS represenatation of the databse.
 * @param {string} type The type of interval.
 * @param {number} lo The starting index of the interval.
 * @param {number} hi The end index of the interval.
 */
export const getChartData = (database, type, lo, hi) => {
  return database
    .get(type)
    .slice(lo, hi)
    .toJS();
};

export const getChartColors = (data, color) => {
  if (data[0].type === "part" || data[0].type === "hour") {
    return data.map(item => color[item["part"]]);
  }
  return "#32b345";
};
