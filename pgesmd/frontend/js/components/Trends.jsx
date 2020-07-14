import React from "react";
import { EnergyHistory } from "../data-structures/EnergyHistory";
import { Line } from "react-chartjs-2";
import { sub } from "date-fns";
import { fastRollingMean } from "../functions/fastRollingMean";
import { rolling } from "../functions/rolling";
import { makeFillWindow } from "../functions/makeFillWindow";
import { standardDeviationOf } from "../functions/standardDeviationOf";
import { meanOf } from "../functions/meanOf";
import { minZero } from "../functions/minZero";
import { endOf } from "../functions/endOf";
import TrendSmooth from "./TrendSmooth";

const Trends = ({ energyHistory }) => {
  const dateMostRecent = energyHistory.lastDate;
  const dateFourWeeksAgo = endOf("day")(sub(dateMostRecent, { days: 28 }));
  const dateFiveWeeksAgo = endOf("day")(sub(dateMostRecent, { days: 35 }));

  const lastFiveWeeks = new EnergyHistory(
    energyHistory.response,
    {
      start: dateFiveWeeksAgo,
      end: dateMostRecent,
    },
    "Custom Range"
  );

  const unpaddedSlice = energyHistory.slice(dateFourWeeksAgo, dateMostRecent);
  const slice = energyHistory.slice(dateFiveWeeksAgo, dateMostRecent);

  const index = slice.size - unpaddedSlice.size;

  const rawHours = slice.map((x) => x.get("active")).toArray();
  const rawTimes = slice.map((x) => x.get("x")).toArray();

  const fillWindow = makeFillWindow(24)(rawHours);

  const rMeanRaw = fastRollingMean(24)(rawHours);
  const rMean = fillWindow(meanOf)(rMeanRaw);

  const _rStdRaw = rolling(standardDeviationOf, 24, rawHours);
  const _rStd = fillWindow(standardDeviationOf)(_rStdRaw);
  const wholeStd = meanOf(_rStd);
  console.log(wholeStd);

  const noSpikes = new Array(rMean.length);
  noSpikes[0] = meanOf(rawHours);
  for (let i = 0; i < rMean.length; i++) {
    const wattHours = rawHours[i];
    const mean = rMean[i];
    const std = _rStd[i];
    const time = rawTimes[i];

    if (wattHours > mean + 2 * wholeStd) {
      noSpikes[i] = mean;
      continue;
    }
    noSpikes[i] = wattHours;
  }

  const newFillWindow = makeFillWindow(24 * 2)(noSpikes);
  const newRMeanRaw = fastRollingMean(24 * 2)(noSpikes);
  const newRMean = newFillWindow(meanOf)(newRMeanRaw);

  const newRMeanDay = newRMean.reduce((acc, x, i) => {
    acc[Math.floor(i / 24)] += x / 24;
    return acc;
  }, new Array(35).fill(0));

  console.log(newRMeanDay);

  // const smooth = newRMeanDay.map((x, i) => {
  //   return {
  //     x: rawTimes[i * 24],
  //     y: x,
  //   };
  // });

  const smoothHigh = newRMean.map((x, i) => {
    return {
      x: rawTimes[i],
      y: x,
    };
  });

  const rMeanData = rMean.map((x, i) => {
    return {
      x: rawTimes[i],
      y: x,
    };
  });

  console.log(rMean);

  const scatter = unpaddedSlice
  .map((x) => ({ x: x.get("x"), y: x.get("active") }))
  .toJS()

  const almostSmooth = scatter.reduce((acc, x, i) => {
    acc[Math.floor(i / 24)] += x.y / 24;
    return acc;
  }, new Array(28).fill(0));


  const smooth = almostSmooth.map((x, i) => {
    return {
      x: scatter[i * 24].x,
      y: x,
    };
  });

  const data = {
    datasets: [
      // {
      //   data: unpaddedSlice
      //     .map((x) => {
      //       return { x: x.get("x"), y: x.get("active") };
      //     })
      //     .toArray(),
      //   type: "scatter",
      // },
      // { data: rMeanData.slice(index), type: "line" },
      {
        data: scatter
      },
      {
        data: smooth
      }
    ],
  };

  energyHistory.chartOptions.tooltips = {
    label: (x) => x.yLabel,
    title: (x) => x.label,
  };

  energyHistory.chartOptions.scales.yAxes[0].stacked = false;
  energyHistory.chartOptions.scales.yAxes[0].ticks.max = 7000;

  lastFiveWeeks.data.datasets[0].type = "line";
  lastFiveWeeks.data.datasets[1].type = "scatter";
  // <Line data={data} options={energyHistory.chartOptions} />
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        position: "relative",
        margin: "auto",
        height: "100%",
        width: "100%",
      }}
    >
      <h1>{`${energyHistory.friendlyName} Energy Usage Trends`}</h1>
      <div className="day-week-pattern">
        <TrendSmooth dataset={data.datasets[0].data} smooth={smooth} />
      </div>
      <div className="day-week-pattern">
        
      </div>
      <div className="day-week-pattern">
        
      </div>
    </div>
  );
};
export default Trends;
