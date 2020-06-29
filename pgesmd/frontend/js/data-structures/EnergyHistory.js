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
import { minZero } from "../functions/minZero";
import { makeBarGraphData } from "./helpers/zipPassiveCalculation";
import { editHsl } from "../functions/editHsl";

export class EnergyHistory {
  constructor(response, interval = null) {
    this.response = response;
    this.database = response.database;
    this.hourlyMean = response.hourlyMean;
    this.friendlyName = response.friendlyName;
    this.lastUpdate = response.lastUpdate;
    this.partitionOptions = response.partitionOptions;

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
    this.carbonMultiplier = 0.05; // TODO: lookup by utility

    // this.chartDataPassiveUse = compose(
    //     fillInPassiveUseBlanks,
    //   makeChartData(this.passiveUse),
    //   makeIntervalArray
    // )(this).toJS()

    this.chartData = compose(
      makeChartData(this.database),
      makeIntervalArray
    )(this);

    this._graphData = this.chartData.map((x) => {
      return Map({
        x: x.get("x"),
        y: x.get("active"),
      });
    });

    this.activeGraph = this.chartData
      .map((x) => ({
        x: x.get("x"),
        y: x.get("active"),
      }))
      .toJS();

    this.passiveGraph = this.chartData
      .map((x) => ({
        x: x.get("x"),
        y: x.get("passive"),
      }))
      .toJS();

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
          data: this.chartData
            .map((x) => ({
              x: x.get("x"),
              y: x.get("passive"),
            }))
            .toJS(),
          backgroundColor: makeColorsArray(this.partitionOptions)(
            this._graphData
          )
            .toArray()
            .map((x) => editHsl(x, { s: (s) => s - 10, l: (l) => l + 15 })),
          // slicePassive(this.passiveUse, this.startDateMs, this.endDateMs),
          // options
          borderColor: "red",
          pointRadius: 0,
        },
        {
          label: "Energy Consumption",
          type: "bar",
          data: this._graphData.toJS(),
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
        extract("total")(
          this.database.slice(
            indexInDb(this.database)(this.startDateMs),
            indexInDb(this.database)(this.endDateMs)
          )
        )
      ),
      partitionTotalSums: sumPartitions("total")(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDateMs),
          indexInDb(this.database)(this.endDateMs)
        )
      ),
      partitionActiveSums: sumPartitions("active")(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDateMs),
          indexInDb(this.database)(this.endDateMs)
        )
      ),
      partitionPassiveSums: sumPartitions("passive")(this.partitionOptions)(
        this.database.slice(
          indexInDb(this.database)(this.startDateMs),
          indexInDb(this.database)(this.endDateMs)
        )
      ),
    };
    this.chartOptions = chartOptions(this);
  }

  prev() {
    const nextStart = startOf(this.windowData.windowSize)(
      sub(this.data.start, toDateInterval(this.windowData.windowSize))
    );
    return new EnergyHistory(this.response, {
      start: nextStart,
      end: endOf(this.windowData.windowSize)(nextStart),
    });
  }

  next() {
    const nextStart = startOf(this.windowData.windowSize)(
      add(this.data.start, toDateInterval(this.windowData.windowSize))
    );
    return new EnergyHistory(this.response, {
      start: nextStart,
      end: endOf(this.windowData.windowSize)(nextStart),
    });
  }

  setWindow(interval) {
    if (interval === "complete") {
      return new EnergyHistory(this.response, {
        start: this.firstDate,
        end: this.lastDate,
      });
    }
    return new EnergyHistory(this.response, {
      start: startOf(interval)(this.data.start),
      end: endOf(interval)(this.data.start),
    });
  }

  slice(startDate, endDate) {
    return this.database.slice(
      indexInDb(this.database)(getTime(startDate)),
      indexInDb(this.database)(getTime(endDate))
    );
  }
}
