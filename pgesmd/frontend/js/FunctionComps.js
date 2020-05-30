import { checkDisableScroll, parseHourResponse } from "./Functions";
import { getData, getHours } from "./api/DatabaseService";
import { parseDataResponse, immutableDb } from "./Functions";

const pipe = (...functions) => (x, ...args) =>
  functions.reduce((v, f) => f(v, ...args), x);

export const checkDisablePrev = (data, database) =>
  checkDisableScroll(data, database, "prev");

export const checkDisableNext = (data, database) =>
  checkDisableScroll(data, database, "next");

export async function fetchData(source) {
  const data = await getData(source);
  const parse = pipe(parseDataResponse, immutableDb);
  return parse(data);
}

export async function fetchHours(source) {
  const data = await getHours(source);
  const parse = pipe(parseHourResponse, immutableDb);
  return parse(data);
}
