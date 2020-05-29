import {
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";

/**
 * String -> Function
 *
 * Return the date-fns function corresponding to the interval.
 * @param {String} interval The interval: hour, day, week, month, or year.
 */
export default function startOf(interval) {
  return {
    hour: startOfHour,
    day: startOfDay,
    week: startOfWeek,
    month: startOfMonth,
    year: startOfYear,
  }[interval];
}
