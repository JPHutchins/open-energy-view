import { differenceInMilliseconds, format } from "date-fns";
import { reduce, map } from "ramda";

/**
 * Object -> ( List -> [String] )
 * 
 * @param {Object} partitions The user's partitions preferences.
 * @param {List} data The EnergyHistory data of the current window.
 */
export const makeColorsArray = (partitions) => (data) => {
  const first = new Date(data.first().get("x"));
  const last = new Date(data.last().get("x"));
  if (Math.abs(differenceInMilliseconds(first, last)) > 86400000) return List();

  const output = map((x) => {
    const _hour = format(new Date(x.get("x")), "H");
    const _index = partitions.chain(
      reduce((acc, x) => {
        return _hour >= x.start ? acc + 1 : acc;
      }, -1)
    );
    const _i = _index < 0 ? partitions.value.length - 1 : _index;
    return partitions.value[_i].color;
  }, data);
  return output;
};
