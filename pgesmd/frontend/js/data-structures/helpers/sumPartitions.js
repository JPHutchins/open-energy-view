import { map, reduce } from "ramda";
import { format } from "date-fns";

export const sumPartitions = (partitions) => (data) => {
  // TODO: implement memoized DP for subset of already calculated sums
  // Store tabulation [obj (first sum), ..., obj (result)]
  // Subset: sum(i, j) -> dp[j] - dp[i - 1]
  // This would be cleared if user changes partition boundaries!
  // O(1) for subsequent calls - call it on every initial load in/ part update?
  if (partitions.isLeft) return data;

  partitions = partitions.map(
    map((x) => ({
      name: x.name,
      start: x.start,
      sum: 0,
    }))
  );
  const result = (data) =>
    reduce(
      (acc, x) => {
        const _hour = format(new Date(x.get("x")), "H");
        const _index = partitions.chain(
          reduce((acc, x) => {
            return _hour >= x.start ? acc + 1 : acc;
          }, -1)
        );
        const _i = _index < 0 ? partitions.value.length - 1 : _index;
        acc[_i].sum += x.get("total");
        return acc;
      },
      partitions.value,
      data
    );
  return result(data);
};
