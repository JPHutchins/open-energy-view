import { format } from "date-fns";
import { fromJS } from "immutable";

export const tabulatePartitionSums = (database, partitionOptions) => {
  const partitions = partitionOptions.value.map((x) => ({
    name: x.name,
    start: x.start,
    sum: 0,
  }));

  let previousTableEntry = new Array(partitions.length).fill({
    sumActive: 0,
    sumPassive: 0,
    sumTotal: 0,
  });

  const tabulation = [previousTableEntry];

  for (const datapoint of database) {
    const _hour = format(new Date(datapoint.get("x")), "H");

    const _pIndex = partitions.reduce((acc, x) => {
      return _hour >= x.start ? acc + 1 : acc;
    }, -1);
    const _i = _pIndex < 0 ? partitions.length - 1 : _pIndex;

    const tableEntry = Array.from(previousTableEntry);

    tableEntry[_i] = {
      name: partitions[_i].name,
      start: partitions[_i].start,
      sumActive: previousTableEntry[_i].sumActive + datapoint.get("active"),
      sumPassive: previousTableEntry[_i].sumPassive + datapoint.get("passive"),
      sumTotal:
        previousTableEntry[_i].sumTotal +
        datapoint.get("active") +
        datapoint.get("passive"),
    };

    tabulation.push(tableEntry);
    previousTableEntry = tableEntry;
  }

  return fromJS(tabulation)
};
