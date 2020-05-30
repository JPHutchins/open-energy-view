// extract :: List( Map ) -> [v]
/**
 * ImmutableJS List[ ImmutableJS Map{ k: v } ] -> [v]
 * 
 * Extract (unwrap) the values of the given key and return in an Array.
 * @param {String} key The key to the desired values.
 * @param {List} list The ImmutableJS List from which to extract the values.
 */
export default function extract(key) {
  return function (list) {
    return list.map((x) => x.get(key));
  };
}
