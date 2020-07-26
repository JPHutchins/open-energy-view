/**
 * String -> String
 *
 * Return the window size that corresponds to the input interval.
 * @param {String} interval The interval.
 */
export function intervalToWindow(interval) {
  return {
    hour: "day",
    part: "week",
    day: "month",
    week: "year",
    month: "complete",
  }[interval];
}
