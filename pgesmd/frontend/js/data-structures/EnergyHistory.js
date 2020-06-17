import { calculatePassiveUse } from "./helpers/calculatePassiveUse";
import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum } from "ramda";
import { Either } from "ramda-fantasy";
import { getTime } from "date-fns";
import { intervalToWindow } from "../functions/intervalToWindow";
import { sumPartitions } from "./helpers/sumPartitions";
import { extract } from "../functions/extract";
import { toDateInterval } from "../functions/toDateInterval";
import { startOf } from "../functions/startOf";
import { endOf } from "../functions/endOf";
import { slicePassive } from "../functions/slicePassive";
import { getDataset } from "./helpers/getDataset";
import { indexInDb } from "../functions/indexInDb";
import { chartOptions } from "./helpers/chartOptions";
import { defaultPartitions } from "./helpers/defaultPartitions";
import { memoizePassiveUse } from "./helpers/memoizePassiveUse";
import { alltimeMeanByDay } from "../functions/alltimeMeanByDay";

export class EnergyHistory {
  constructor(response, interval = null, memo = {}) {
    this.response = response;
    this.memo = memo;
    this.friendlyName = response.friendlyName;
    this.lastUpdate = response.lastUpdate;
    this.database = response.database;
    this.partitionOptions = response.partitionOptions
      ? Either.Right(response.partitionOptions)
      : Either.Right(defaultPartitions);
    this.chartOptions = chartOptions;
    this.passiveUse = memoizePassiveUse(this, calculatePassiveUse);
    if (interval) {
      this.startDate = interval.start;
      this.endDate = interval.end;
    } else {
      this.startDate = startOf("day")(new Date(this.database.last().get("x")));
      this.endDate = endOf("day")(this.startDate);
    }
    this.startDateMs = getTime(this.startDate);
    this.endDateMs = getTime(this.endDate) + 1;

    this.firstDate = new Date(this.database.first().get("x"));
    this.lastDate = new Date(this.database.last().get("x"));

    this.alltimeMeanByDay = alltimeMeanByDay(this.database);

    this._graphData = getDataset(this.database)(this);
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
          backgroundColor: makeColorsArray(this.partitionOptions)(
            this._graphData
          ).toArray(),
        },
        {
          label: "Passive Consumption",
          type: "line",
          data: slicePassive(this.passiveUse, this.startDateMs, this.endDateMs),
          // options
          borderColor: "red",
          pointRadius: 0,
        },
      ],
    };
    this.windowData = {
      windowSize: intervalToWindow(this.data.intervalSize),
      windowSum: sum(extract("y")(this._graphData)),
      partitionSums: sumPartitions(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDateMs),
          indexInDb(this.database)(this.endDateMs)
        )
      ),
    };
  }

  prev() {
    return new EnergyHistory(
      this.response,
      {
        start: sub(this.data.start, toDateInterval(this.windowData.windowSize)),
        end: sub(this.data.end, toDateInterval(this.windowData.windowSize)),
      },
      this.memo
    );
  }

  next() {
    return new EnergyHistory(
      this.response,
      {
        start: add(this.data.start, toDateInterval(this.windowData.windowSize)),
        end: add(this.data.end, toDateInterval(this.windowData.windowSize)),
      },
      this.memo
    );
  }

  setWindow(interval) {
    return new EnergyHistory(
      this.response,
      {
        start: startOf(interval)(this.data.start),
        end: endOf(interval)(this.data.start),
      },
      this.memo
    );
  }
}
