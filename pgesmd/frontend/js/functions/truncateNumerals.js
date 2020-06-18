/**
 * Number -> Function -> Number
 */
export const truncateNumerals = (numerals) => (number) => {
  const places = Math.floor(Math.log10(number));
  const decimalPlaces = Math.max(0, numerals - places - 1);
  return number.toFixed(decimalPlaces);
};
