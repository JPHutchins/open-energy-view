import { findMaxResolution } from "../functions/findMaxResolution";
import { differenceInMilliseconds, add, sub, isBefore } from "date-fns";
import { makeColorsArray } from "./helpers/makeColorsArray";
import { sum, compose } from "ramda";
import { getTime } from "date-fns";
import { intervalToWindow } from "../functions/intervalToWindow";
import { extract } from "../functions/extract";
import { toDateInterval } from "../functions/toDateInterval";
import { startOf } from "../functions/startOf";
import { endOf } from "../functions/endOf";
import { indexInDb } from "../functions/indexInDb";
import { chartOptions } from "./helpers/chartOptions";
import { makeIntervalArray } from "../functions/makeIntervalArray";
import { makeChartData } from "../functions/makeChartData";
import { Map } from "immutable";
import { editHsl } from "../functions/editHsl";

export class EnergyHistory {
  constructor(response, interval = null) {
    this.response = response;
    this.database = response.database;
    this.hourlyMean = response.hourlyMean;
    this.friendlyName = response.friendlyName;
    this.lastUpdate = response.lastUpdate;
    this.partitionOptions = response.partitionOptions;
    this.firstDate = new Date(this.database.first().get("x"));
    this.lastDate = new Date(this.database.last().get("x"));
    // TODO add dateStartDate and dataEndDate and apply, namely to windowHours

    if (interval) {
      this.startDate = interval.start;
      this.endDate = interval.end;
      this.custom = interval.custom === true;
    } else {
      this.startDate = startOf("day")(this.lastDate);
      this.endDate = endOf("day")(this.lastDate);
    }

    this.firstData = isBefore(this.startDate, this.firstDate)
      ? this.firstDate
      : this.startDate;

    this.startDateMs = getTime(this.startDate);
    this.endDateMs = getTime(this.endDate);

    this.startDateIndex = indexInDb(this.database)(this.startDateMs);
    this.endDateIndex = indexInDb(this.database)(this.endDateMs);

    this.partitionSums = response.partitionSums;

    //TODO - refactor to avoid all this and rethink how mean is calculated
    this.carbonMultiplier = 0.05; // TODO: lookup by utility

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

      console.log(this.chartData
        .map((x) => ({
          x: x.get("x"),
          y: x.get("total"),
        }))
        .toJS())

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
          data: this.passiveGraph,
          backgroundColor: makeColorsArray(this.partitionOptions)(
            this._graphData
          )
            .toArray()
            .map((x) => editHsl(x, { s: (s) => s - 10, l: (l) => l + 15 })),
          // options
          pointRadius: 0,
          barThickness: "flex",
        },
        {
          label: "Energy Consumption",
          type: "bar",
          data: this.activeGraph,
          backgroundColor: makeColorsArray(this.partitionOptions)(
            this._graphData
          ).toArray(),
          barThickness: "flex",
        },
      ],
    };

    this.windowData = {
      windowSize: this.custom
        ? "custom"
        : intervalToWindow(this.data.intervalSize),
      windowSum: sum(
        extract("total")(
          this.database.slice(this.startDateIndex, this.endDateIndex)
        )
      ),
    };
    this.chartOptions = chartOptions(this);
  }

  setDate(date) {
    if (this.windowData.windowSize === "complete") return this;
    return new EnergyHistory(this.response, {
      start: startOf(this.windowData.windowSize)(date),
      end: endOf(this.windowData.windowSize)(date),
    });
  }

  setCustomRange(startDate, endDate) {
    if (this.windowData.windowSize === "complete") return this;
    return new EnergyHistory(this.response, {
      start: startOf("day")(startDate),
      end: endOf("day")(endDate),
      custom: true,
    });
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
    if (interval === "custom") {
      this.custom = true;
      return this;
    }
    return new EnergyHistory(this.response, {
      start: startOf(interval)(this.firstData),
      end: endOf(interval)(this.firstData),
    });
  }

  slice(startDate, endDate) {
    return this.database.slice(
      indexInDb(this.database)(getTime(startDate)),
      indexInDb(this.database)(getTime(endDate))
    );
  }
}
