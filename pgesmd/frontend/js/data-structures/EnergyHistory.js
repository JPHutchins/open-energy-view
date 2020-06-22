import { calculatePassiveUse } from "./helpers/calculatePassiveUse";
import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum, compose, map } from "ramda";
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
import { makeIntervalArray } from "../functions/makeIntervalArray";
import { makeChartData } from "../functions/makeChartData";
import { fillInPassiveUseBlanks } from "../functions/fillInPassiveUseBlanks";
import { Map } from "immutable";
import {minZero} from "../functions/minZero"

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

    //TODO - refactor to avoid all this and rethink how mean is calculated
    this.alltimeMeanByDay = alltimeMeanByDay(
      intervalToWindow(
        findMaxResolution(
          differenceInMilliseconds(this.startDate, this.endDate)
        )
      )
    )(this.database);
    this.carbonMultiplier = 0.05; // TODO: lookup by utility

    this._graphData = getDataset(this.database)(this);

    this.chartDataPassiveUse = compose(
        fillInPassiveUseBlanks,
      makeChartData(this.passiveUse),
      makeIntervalArray
    )(this).toJS()

    this.chartData = compose(
        makeChartData(this.database),
        makeIntervalArray
    )(this).map((x, i) => Map({
        x: x.get('x'),
        y: minZero(x.get('y') - this.chartDataPassiveUse[i].y),
        sum: x.get('sum')
    })).toJS()

    console.log(this.chartData)

    this.data = {
      start: this.startDate,
      end: this.endDate,
      intervalSize: findMaxResolution(
        differenceInMilliseconds(this.startDate, this.endDate)
      ),
      datasets: [
        {
          label: "Passive Consumption",
          type: "bar",
          data: this.chartDataPassiveUse,
          // slicePassive(this.passiveUse, this.startDateMs, this.endDateMs),
          // options
          borderColor: "red",
          pointRadius: 0,
        },
        {
          label: "Energy Consumption",
          type: "bar",
          data: this.chartData,
          backgroundColor: makeColorsArray(this.partitionOptions)(
            this._graphData
          ).toArray(),
        },
      ],
    };
    this.windowData = {
      windowSize: intervalToWindow(this.data.intervalSize),
      //TODO: refactor to add a helper and avoid this index lookup
      windowSum: sum(
        extract("y")(
          this.database.slice(
            indexInDb(this.database)(this.startDateMs),
            indexInDb(this.database)(this.endDateMs)
          )
        )
      ),
      partitionSums: sumPartitions(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDateMs),
          indexInDb(this.database)(this.endDateMs)
        )
      ),
    };
    this.chartOptions = chartOptions(this);
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

  slice(startDate, endDate) {
    return this.database.slice(
      indexInDb(this.database)(getTime(startDate)),
      indexInDb(this.database)(getTime(endDate))
    );
  }
}
