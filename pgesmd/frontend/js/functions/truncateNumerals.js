/**
 * Number -> Function -> Number
 */
export const truncateNumerals = (numerals) => (number) => {
  const places = Math.floor(Math.log10(number));
  const decimalPlaces = Math.max(0, numerals - places - 1);
  if (decimalPlaces === 0) {
      number = Math.round(number)
  }
  return number.toFixed(decimalPlaces);
};
