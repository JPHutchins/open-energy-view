export const lookupPartitionSums = (tabulation, startIndex, endIndex) => {
  const leftTab = tabulation.get(startIndex);
  const rightTab = tabulation.get(endIndex);

  const getDifference = (l, r) => {
    return {
      name: l.get("name"),
      start: l.get("start"),
      sumActive: r.get("sumActive") - l.get("sumActive"),
      sumPassive: r.get("sumPassive") - l.get("sumPassive"),
      sumTotal: r.get("sumTotal") - l.get("sumTotal"),
    };
  };

  const zipLR = (l, r) => {
    if (l.size != r.size) return;

    const output = [];
    for (let i = 0; i < l.size; i++) {
      output.push(getDifference(l.get(i), r.get(i)));
    }

    return output;
  };

  return zipLR(leftTab, rightTab);
};
