/**
 * String -> {k: v}
 *
 * Convert string to a date interval used by date-fns for functions like add.
 * For example, toDateInterval("hour") -> {hours: 1}
 * @param {String} interval Time interval type, singular: "hour", "day", "week",
 * "month", or "year".
 */
export function toDateInterval(interval) {
  return {
    hour: { hours: 1 },
    day: { days: 1 },
    week: { weeks: 1 },
    month: { months: 1 },
    year: { years: 1 },
  }[interval];
}
