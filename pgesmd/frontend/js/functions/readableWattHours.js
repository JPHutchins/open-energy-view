import { truncateNumerals } from "./truncateNumerals";

export const readableWattHours = (watts) => {
  if (watts < 1000) return truncateNumerals(3)(watts) + "Wh";
  return (
    truncateNumerals(3)(watts / 1000)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "kWh"
  );
};
