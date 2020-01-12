import checkDisableScroll from "./Functions";

const pipe = (...functions) => (x, ...args) =>
  functions.reduce((v, f) => f(v, ...args), x);

export const checkDisablePrev = (data, database) =>
  checkDisableScroll(data, database, "prev");

export const checkDisableNext = (data, database) =>
  checkDisableScroll(data, database, "next");
