import { calculatePassiveUse } from "./helpers/calculatePassiveUse";
import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum } from "ramda";
import { intervalToWindow } from "../functions/intervalToWindow";
import { sumPartitions } from "./helpers/sumPartitions";
import { extract } from "../functions/extract";
import { toDateInterval } from "../functions/toDateInterval";
import { startOf } from "../functions/startOf";
import { endOf } from "../functions/endOf";
import { getDataset } from "./helpers/getDataset";
import { indexInDb } from "../functions/indexInDb";

export class EnergyHistory {
  constructor(database, partitionOptions, interval, passiveUse = null) {
    this.database = database;
    this.partitionOptions = partitionOptions;
    this.passiveUse = passiveUse ? passiveUse : calculatePassiveUse(database);
    this._graphData = getDataset(database)({
      start: interval.start,
      end: interval.end,
    });
    this.data = {
      start: interval.start,
      end: interval.end,
      intervalSize: findMaxResolution(
        differenceInMilliseconds(interval.start, interval.end)
      ),
      datasets: [
        {
          label: "Energy Consumption",
          type: "bar",
          data: this._graphData.toJS(),
          backgroundColor: makeColorsArray(partitionOptions)(
            this._graphData
          ).toArray(),
        },
        {
          label: "Passive Consumption",
          type: "line",
          data: this.passiveUse,
        },
      ],
    };
    this.windowData = {
      windowSize: intervalToWindow(this.data.intervalSize),
      windowSum: sum(extract("y")(this._graphData)),
      partitionSums: sumPartitions(partitionOptions)(
        this.database.slice(
          indexInDb(database)(interval.start),
          indexInDb(database)(interval.end)
        )
      ),
    };
  }

  prev() {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: sub(this.data.start, toDateInterval(this.windowData.windowSize)),
        end: sub(this.data.end, toDateInterval(this.windowData.windowSize)),
      },
      this.passiveUse
    );
  }

  next() {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: add(this.data.start, toDateInterval(this.windowData.windowSize)),
        end: add(this.data.end, toDateInterval(this.windowData.windowSize)),
      },
      this.passiveUse
    );
  }

  setWindow(interval) {
    return new EnergyHistory(
      this.database,
      this.partitionOptions,
      {
        start: startOf(interval)(this.data.start),
        end: endOf(interval)(this.data.start),
      },
      this.passiveUse
    );
  }
}
