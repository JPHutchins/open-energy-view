import {
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from "date-fns";

/**
 * String -> Function
 *
 * Return the date-fns function corresponding to the interval.
 * @param {String} interval The interval: hour, day, week, month, or year.
 */
export default function endOf(interval) {
  return {
    hour: endOfHour,
    day: endOfDay,
    week: endOfWeek,
    month: endOfMonth,
    year: endOfYear,
  }[interval];
}
