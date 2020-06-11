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
import { chartOptions } from "./helpers/chartOptions";

export class EnergyHistory {
  constructor(database, partitionOptions, interval = null, passiveUse = null) {
    this.database = database;
    this.partitionOptions = partitionOptions;
    this.chartOptions = chartOptions;
    this.passiveUse = passiveUse // TODO: Either forking
      ? passiveUse
      : calculatePassiveUse(database).value;

    if (interval) {
      this.startDate = interval.start;
      this.endDate = interval.end;
    } else {
      this.startDate = startOf("day")(new Date(database.last().get("x")));
      this.endDate = endOf("day")(this.startDate);
    }

    this._graphData = getDataset(database)(this);
    this.data = {
      start: this.startDate,
      end: this.endDate,
      intervalSize: findMaxResolution(
        differenceInMilliseconds(this.startDate, this.endDate)
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
          indexInDb(database)(this.startDate),
          indexInDb(database)(this.endDate)
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
