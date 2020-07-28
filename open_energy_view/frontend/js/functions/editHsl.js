import { compose } from "ramda";

export const editHsl = (hsl, editObject) => {
  if (hsl.slice(0, 3) != "hsl") {
    // console.log(`Bargraph colors should be in HSL, got ${hsl} instead.`);
    return hsl;
  }

  const stripHslPrefix = (hsl) => hsl.split("(")[1];
  const removeClosingP = (hsl) => hsl.split(")")[0];
  const makeNumbers = (hslStripped) =>
    hslStripped.split(",").map((x) => parseInt(x));
  const makeHslObject = (hslArray) => ({
    h: hslArray[0],
    s: hslArray[1],
    l: hslArray[2],
  });

  const createHslObject = compose(
    makeHslObject,
    makeNumbers,
    removeClosingP,
    stripHslPrefix
  );

  const hslObject = createHslObject(hsl);

  editObject = {
    h: editObject.h ? editObject.h : (x) => x,
    s: editObject.s ? editObject.s : (x) => x,
    l: editObject.l ? editObject.l : (x) => x,
  };

  const newHslObject = {
    h: editObject.h(hslObject.h),
    s: editObject.s(hslObject.s),
    l: editObject.l(hslObject.l),
  };

  const newHslString = `hsl(${newHslObject.h}, ${newHslObject.s}%, ${newHslObject.l}%)`;
  return newHslString;
};
