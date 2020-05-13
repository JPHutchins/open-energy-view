const { fromJS } = require("immutable");

export const parseDataResponse = (res) => {
  //TODO: error handling
  return JSON.parse(res.data);
};

export const parseHourResponse = (res) => {
  const database = res.data.split(",");
  return database.map((x) => makeChartJsDatabase(x));
};

const makeChartJsDatabase = (x) => {
  const secondsInHour = 3600;
  const msInSeconds = 1000;
  return {
    x: x.slice(0, 6) * secondsInHour * msInSeconds,
    y: parseInt(x.slice(6)),
  };
};

export const immutableDb = (data) => {
  return fromJS(data);
};

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
  return database.get("lookup").get(type).get(startDate.toString());
};

export const getHi = (database, type, endDate) => {
  return database.get("lookup").get(type).get(endDate.toString());
};

/**
 * Return JSON slice of database of the specified type between index lo and hi.
 *
 * @param {ImmutableJSMapsAndLists} database The ImmutableJS represenatation of the database.
 * @param {string} type The type of interval.
 * @param {number} lo The starting index of the interval.
 * @param {number} hi The end index of the interval.
 */
export const getChartData = (database, type, lo, hi) => {
  return database.get(type).slice(lo, hi).toJS();
};

/**
 * Return a string or [string, ...] of color(s) corresponding to "partitions".
 *
 * @param {object} data The data as prepared for ChartJS by a function like getChartData.
 * @param {array} color The colors of "partitions" [color of part 0, color of part 1 , ...].
 */
export const getChartColors = (data, color) => {
  if (data[0].type === "part" || data[0].type === "hour") {
    return data.map((item) => color[item["part"]]);
  }
  return "#32b345";
};
