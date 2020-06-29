import { truncateNumerals } from "./truncateNumerals";

export const readableWatts = (watts) => {
  if (watts < 1000) return truncateNumerals(3)(watts) + "Wh";
  return truncateNumerals(3)(watts / 1000) + "kWh";
};
