export const to12Hour = (hour) => {
  if (hour < 0) return undefined;
  if (hour === 0) return "12AM";
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return "12PM";
  if (hour > 12) return `${hour - 12}PM`;
  if (hour >= 24) return undefined;
};
