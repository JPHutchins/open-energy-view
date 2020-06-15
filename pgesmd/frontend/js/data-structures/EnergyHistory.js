import { calculatePassiveUse } from "./helpers/calculatePassiveUse";
import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum } from "ramda";
import { fromJS as toImmutableJSfromJS } from "immutable";
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

export class EnergyHistory {
  constructor(
    response,
    interval = null,
    passiveUse = null,
    immutableDB = null
  ) {
    this.response = response;
    this.friendlyName = response.friendlyName;
    this.lastUpdate = response.lastUpdate;
    this.database = immutableDB
      ? immutableDB
      : toImmutableJSfromJS(response.database);
    this.partitionOptions = response.partitionOptions
      ? Either.Right(response.partitionOptions)
      : Either.Right(defaultPartitions);
    this.chartOptions = chartOptions;
    this.passiveUse = passiveUse // TODO: Either forking
      ? passiveUse
      : calculatePassiveUse(this.database).value;
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
      this.passiveUse,
      this.database
    );
  }

  next() {
    return new EnergyHistory(
      this.response,
      {
        start: add(this.data.start, toDateInterval(this.windowData.windowSize)),
        end: add(this.data.end, toDateInterval(this.windowData.windowSize)),
      },
      this.passiveUse,
      this.database
    );
  }

  setWindow(interval) {
    return new EnergyHistory(
      this.response,
      {
        start: startOf(interval)(this.data.start),
        end: endOf(interval)(this.data.start),
      },
      this.passiveUse,
      this.database
    );
  }
}
