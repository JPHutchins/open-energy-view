import { zip } from "ramda";

/**
 * [Any], [Any], [Any] -> [[Any, Any, Any]]
 * 
 * Zip together three equally sized arrays.
 * @param {Array} first
 * @param {Array} second
 * @param {Array} third
 */
export default function zip3(first, second, third) {
  // Refactor to avoid zip import and triple iteration
  return zip(first, zip(second, third)).map((x) => [x[0], x[1][0], x[1][1]]);
}
