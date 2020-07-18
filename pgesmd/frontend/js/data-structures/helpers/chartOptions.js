import { readableWattHours } from "../../functions/readableWattHours";
import { format, roundToNearestMinutes } from "date-fns";

const title = (tooltipItem, energyHistory) => {
  const datapoint = energyHistory.chartData.get(tooltipItem.index);
  const total = datapoint.get("total");
  const maybeSum = datapoint.get("sum");
  const sum =
    total === maybeSum ? "" : `\n${readableWattHours(maybeSum)} total`;

  const dateFormat = () => {
    switch (energyHistory.data.intervalSize) {
      case "hour":
      case "part":
        return "ha";
      case "day":
        return "EEEE, MMMM do, yyyy";
      case "week":
        return "MMMM do, yyyy";
      case "month":
        return "MMMM, yyyy";
    }
  };

  const maybeDateTitle = () => {
    switch (energyHistory.data.intervalSize) {
      case "part":
        return `${format(datapoint.get("x"), "MMMM do, yyyy")}\n`;
      default:
        return "";
    }
  };

  const dateTitle = maybeDateTitle();

  const describeAsAverage =
    energyHistory.data.intervalSize === "hour" ? "" : "average";

  const startDateString = `${format(datapoint.get("x"), dateFormat())}`;
  const maybeEndDateString = ` - ${format(
    roundToNearestMinutes(datapoint.get("endTime")),
    dateFormat()
  )}`;

  const endDateString =
    energyHistory.data.intervalSize === "hour" ||
    energyHistory.data.intervalSize === "part" ||
    energyHistory.data.intervalSize === "week"
      ? maybeEndDateString
      : "";

  return `${dateTitle}${startDateString}${endDateString}\n${readableWattHours(
    total
  )} ${describeAsAverage}${sum}`;
};

const activeLabel = (tooltipItem, energyHistory) => {
  const datapoint = energyHistory.chartData.get(tooltipItem.index);
  const active = datapoint.get("active");
  return `${readableWattHours(active)} active`;
};

const passiveLabel = (tooltipItem, energyHistory) => {
  const datapoint = energyHistory.chartData.get(tooltipItem.index);
  const passive = datapoint.get("passive");
  return `${readableWattHours(passive)} passive`;
};

const spikeLabel = (tooltipItem, energyHistory) => {
  const datapoint = energyHistory.chartData.get(tooltipItem.index);
  const spike = datapoint.get("spike");
  return `${readableWattHours(spike)} appliance`;
};

const labelCallbacks = [passiveLabel, activeLabel, spikeLabel];

export const chartOptions = (energyHistory) => {
  const tooltip = {
    label: (tooltipItem) => {
      if (!tooltipItem) return;
      return labelCallbacks[tooltipItem.datasetIndex](
        tooltipItem,
        energyHistory
      );
    },
    title: (tooltipItems) => {
      return title(tooltipItems[0], energyHistory);
    },
  };

  return {
    animation: {
      duration: 0,
    },
    maintainAspectRatio: false,
    responsiveness: true,
    tooltips: {
      callbacks: tooltip,
    },
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
  };
};

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
    month: "MMM YYYY",
  },
};
