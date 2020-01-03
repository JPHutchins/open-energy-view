import checkDisableScroll from "./Functions";

const pipe = (...functions) => (x, ...args) =>
  functions.reduce((v, f) => f(v, ...args), x);

const checkDisablePrev = (data, database) =>
  checkDisableScroll(data, database, "prev");

const checkDisableNext = (data, database) =>
  checkDisableScroll(data, database, "next");

  