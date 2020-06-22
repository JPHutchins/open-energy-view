import { truncateNumerals } from "../../functions/truncateNumerals";

export const chartOptions = (energyHistory) => ({
  maintainAspectRatio: false,
  responsiveness: true,
  legend: {
    display: false,
  },
  scales: {
    xAxes: [
      {
        stacked: true,
        scaleLabel: {
          display: true,
          labelString: "Time Interval",
        },
        type: "time",
        distribution: "linear",
        bounds: "ticks",
        ticks: {
          //beginAtZero: true,
          // labelOffset: xLabelOffset,
          // min: data[0].interval_start,
          // max: data[data.length - 1].interval_end - 1000,
        },
        time: {
          unit: unit[energyHistory.data.intervalSize],
          displayFormats: displayFormats[energyHistory.data.intervalSize],
        },
        offset: true,
        gridLines: {
          display: false,
        },
        barThickness: "flex",
      },
    ],
    yAxes: [
      {
        stacked: true,
        scaleLabel: {
          display: true,
          labelString: "Average Watts of Electricity",
        },
        ticks: {
          beginAtZero: true,
          min: 0,
          // suggestedMax: database.get("info").get("max_watt_hour")
          suggestedMax: 5000,
        },
      },
    ],
  },
});

const unit = {
  hour: "hour",
  part: "day",
  day: "day",
  week: "month",
  month: "month",
};
const displayFormats = {
  hour: {
    hour: "hA",
  },
  part: {
    day: "dddd",
  },
  day: {
    day: "M/D",
  },
  week: {
    month: "MMMM",
  },
  month: {
    month: "MMMM YYYY",
  },
};
