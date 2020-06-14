import { calculatePassiveUse } from "./helpers/calculatePassiveUse";
import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum } from "ramda";
import { fromJS as toImmutableJSfromJS, isImmutable } from "immutable";
import { Either } from "ramda-fantasy";
import { intervalToWindow } from "../functions/intervalToWindow";
import { sumPartitions } from "./helpers/sumPartitions";
import { extract } from "../functions/extract";
import { toDateInterval } from "../functions/toDateInterval";
import { startOf } from "../functions/startOf";
import { endOf } from "../functions/endOf";
import { getDataset } from "./helpers/getDataset";
import { indexInDb } from "../functions/indexInDb";
import { chartOptions } from "./helpers/chartOptions";
import { defaultPartitions } from "./helpers/defaultPartitions";

export class EnergyHistory {
  constructor(response, interval = null, passiveUse = null, immutableDB = null) {
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
          data: this.passiveUse
            .slice(
              indexInDb(this.passiveUse)(this.startDate - 1),
              indexInDb(this.passiveUse)(this.endDate)
            )
            .toJS(),
        },
      ],
    };
    this.windowData = {
      windowSize: intervalToWindow(this.data.intervalSize),
      windowSum: sum(extract("y")(this._graphData)),
      partitionSums: sumPartitions(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDate),
          indexInDb(this.database)(this.endDate)
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
