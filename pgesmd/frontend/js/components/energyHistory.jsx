import React from "react";
import moment from "moment";
import EnergyChart from "./energyChart";
import { getCompleteData, makeOptions } from "../utils.js";
import "../../css/App.css";
import LowerBar from "./LowerBar";
import RightBar from "./RightBar";

const { fromJS } = require("immutable");

export default class EnergyHistory extends React.Component {
  constructor(props) {
    super(props);
    this.colors = ["#0000A0", "#add8e6", "#800080"];
    this.state = {
      data: {},
      description: {
        startDate: "",
        endDate: ""
      },
      disableScroll: {
        disableNext: false,
        disablePrev: false
      },
      hideChart: false,
      range: "day",
      partPieView: "baseline",
      carbonMultiplier: 0.05 // PGE is actually 0.05
    };
    this.indexReference = {
      hour: "day",
      part: "week",
      day: "month",
      week: "year",
      month: "year",
      year: "all"
    };
    this.detailLookup = {
      hour: false,
      part: "hour",
      day: "part",
      week: "day",
      month: "week",
      year: "week"
    };
    this.superTypeToType = {
      day: "hour",
      week: "part",
      month: "day",
      year: "week",
      complete: "month"
    };
    this.typeOrder = {
      data: 0,
      hour: 1,
      part: 2,
      day: 3,
      week: 4,
      month: 5,
      year: 6,
      complete: 7
    };
    this.zoom = ["hour", "part", "day", "week", "month", "year"];
    this.chartSettings = {
      barPercentage: 1,
      barThickness: "flex"
    };
    this.database = undefined;
  }

  componentDidMount = () => {
    getCompleteData()
      .then(data => {
        this.database = fromJS(data);
        console.log(this.database.toJS());
      })
      .then(() => {
        this.setMostRecent(this.superTypeToType[this.state.range]);
      });
  };

  setMostRecent = type => {
    const superType = this.database.get(this.indexReference[type]);

    const lo = superType.get(superType.size - 1).get("i_" + type + "_start");
    const hi = superType.get(superType.size - 1).get("i_" + type + "_end");

    const data = this.getChartData(lo, hi, type, this.database);
    const color = this.getChartColors(data, type, this.colors);

    this.setChartData(data, type, color);
  };

  checkDisableScroll = (data, type, database) => {
    const lastEntry = database
      .get("lookup")
      .get(type)
      .get(data[data.length - 1].interval_start.toString());
    const disableNext = lastEntry >= database.get(type).size - 1;

    const firstEntry = database
      .get("lookup")
      .get(type)
      .get(data[0].interval_start.toString());
    const disablePrev = firstEntry <= 0;

    return {
      disableNext: disableNext,
      disablePrev: disablePrev
    };
  };

  handleScroll = direction => {
    this.scroll(direction, this.state.data.datasets[0].data, this.database);
  };

  scroll = (direction, currentData, database) => {
    const type = currentData[0].type;
    const superType = this.indexReference[type];

    const superInterval = database
      .get(superType)
      .get(currentData[0]["i_" + superType] + direction);

    const data = this.getChartData(
      superInterval.get("i_" + type + "_start"),
      superInterval.get("i_" + type + "_end"),
      type,
      database
    );

    const colors = this.getChartColors(data, type, this.colors);

    this.setChartData(data, type, colors);
  };

  getSlicePoints = (startDate, endDate, type, database) => {
    return {
      lo: database
        .get("lookup")
        .get(type)
        .get(startDate.toString()),
      hi: database
        .get("lookup")
        .get(type)
        .get(endDate.toString())
    };
  };

  getChartData = (lo, hi, type, database) => {
    return database
      .get(type)
      .slice(lo, hi)
      .toJS();
  };

  getChartColors = (data, type, color) => {
    if (type === "part" || type === "hour") {
      return data.map(item => color[item["part"]]);
    }
    return "#32b345";
  };

  barClickEvent = index => {
    const zoom = {
      part: "hour",
      day: "hour",
      week: "part",
      month: "day"
    };

    const currentData = this.state.data.datasets[0].data;
    const type = currentData[0].type;
    const superType = this.indexReference[zoom[type]];

    let lo;
    let hi;

    if (type === "part") {
      lo = this.database
        .get(superType)
        .get(currentData[index]["i_" + superType])
        .get("i_" + zoom[type] + "_start");

      hi = this.database
        .get(superType)
        .get(currentData[index]["i_" + superType])
        .get("i_" + zoom[type] + "_end");
    } else {
      lo = currentData[index]["i_" + zoom[type] + "_start"];
      hi = currentData[index]["i_" + zoom[type] + "_end"];
    }

    const data = this.getChartData(lo, hi, zoom[type], this.database);

    const color = this.getChartColors(data, zoom[type], this.colors);

    this.setState({ range: superType });

    this.setChartData(data, zoom[type], color);
  };

  tooltip = data => ({
    label: (tooltipItem, data) => {
      return tooltipItem.yLabel + " Watts used";
    },
    title: (tooltipItem, data) => {
      let bar = moment(tooltipItem[0].xLabel);
      let start = bar.add(-30, "m");
      let date = start.format("MMMM Do YYYY");
      let weekday = start.format("dddd");
      let start_hour = start.format("hA").toString();
      let end = bar.add(60, "m");
      let interval =
        weekday +
        "\n" +
        date +
        "\n" +
        start_hour +
        " - " +
        end.format("hA").toString();
      return interval;
    }
  });

  getChartDataset = (data, color) => {
    return {
      data: data,
      label: "Bar Chart",
      backgroundColor: color,
      barPercentage: this.chartSettings.barPercentage,
      barThickness: this.chartSettings.barThickness,
      order: 1,
      hidden: this.state.hideChart
    };
  };

  getBaselineDataset = data => {
    let newData;
    if (data[0].type === "day") {
      newData = [];
      let j;
      for (let i = 0; i < data.length; i++) {
        newData.push({
          x: data[i].interval_start,
          y: data[i].baseline
        });
        j = i;
      }
      newData.push({
        x: data[j].interval_end,
        y: data[j].baseline
      });
    } else if (data[0].type === "hour") {
      newData = [
        {
          x: this.database
            .get("day")
            .get(data[0].i_day)
            .get("interval_start"),
          y: this.database
            .get("day")
            .get(data[0].i_day)
            .get("baseline")
        },
        {
          x: this.database
            .get("day")
            .get(data[0].i_day)
            .get("interval_end"),
          y: this.database
            .get("day")
            .get(data[0].i_day)
            .get("baseline")
        }
      ];
    } else if (data[0].type === "month") {
      const dailyData = this.database.get("day").toJS();
      newData = [];
      let j;
      for (let i = 0; i < dailyData.length; i++) {
        newData.push({
          x: dailyData[i].interval_start,
          y: dailyData[i].baseline
        });
        j = i;
      }
      newData.push({
        x: dailyData[j].interval_end,
        y: dailyData[j].baseline
      });
    } else {
      const superType = this.indexReference[data[0].type];
      const i_superType = data[0]["i_" + superType];
      const dailyData = this.database
        .get("day")
        .slice(
          this.database
            .get(superType)
            .get(i_superType)
            .get("i_day_start"),
          this.database
            .get(superType)
            .get(i_superType)
            .get("i_day_end")
        )
        .toJS();
      newData = [];
      let j;
      for (let i = 0; i < dailyData.length; i++) {
        newData.push({
          x: dailyData[i].interval_start,
          y: dailyData[i].baseline
        });
        j = i;
      }
      newData.push({
        x: dailyData[j].interval_end,
        y: dailyData[j].baseline
      });
    }
    return {
      data: newData,
      label: "Baseline",
      order: 0,
      hidden: this.state.hideChart,
      type: "line",
      backgroundColor: "#d1ddd2",
      pointRadius: 0
    };
  };

  setChartData = (data, type, color) => {
    this.setState(
      {
        data: {
          datasets: [
            this.getChartDataset(data, color),
            this.getBaselineDataset(data)
          ]
        },
        options: makeOptions(
          data,
          this.barClickEvent,
          this.tooltip(data),
          this.database
        ),
        description: this.createDescription(data, type),
        disableScroll: this.checkDisableScroll(data, type, this.database)
      },
      () => {
        const chart = this.refs.bargraph.refs.bargraph.chartInstance;
        this.setState({
          options: makeOptions(
            data,
            this.barClickEvent,
            this.tooltip(data),
            this.database,
            chart
          )
        });
      }
    );
  };

  getDetailData = barData => {
    const type = barData[0].type;
    if (type === "hour") return barData;
    const superType = this.indexReference[type];
    const subType = this.detailLookup[type];

    const lo = this.database
      .get(superType)
      .get(barData[0]["i_" + superType])
      .get("i_" + subType + "_start");

    const hi = this.database
      .get(superType)
      .get(barData[0]["i_" + superType])
      .get("i_" + subType + "_end");

    const data = this.database
      .get(subType)
      .slice(lo, hi - 1)
      .toJS();
    return data;
  };

  getDetailDataset = data => {
    return {
      data: this.getDetailData(data),
      backgroundColor: "#DFFFFA",
      fill: false,
      type: "line",
      label: "Details",
      lineTension: 0.4,
      pointRadius: 0,
      borderWidth: 5,
      hoverBackgroundColor: "#DFFFFA",
      hoverBorderColor: "#DFFFFA",
      hoverBorderWidth: 5,
      order: 0,
      hidden: !this.state.hideChart
    };
  };

  getRangeIndex = (targetRange, currentRange) => {
    const getZoom = (targetRange, currentRange) => {
      return this.typeOrder[targetRange] > this.typeOrder[currentRange]
        ? "zoomOut"
        : "zoomIn";
    };
    const zoom = getZoom(targetRange, currentRange);
  };

  handleRangeSelect = event => {
    const targetSuperType = event.toLowerCase();
    const targetType = this.superTypeToType[targetSuperType];

    if (targetSuperType === "complete") {
      const targetData = this.database.get("month").toJS();

      this.setChartData(
        targetData,
        targetType,
        this.getChartColors(targetData, targetType, this.colors)
      );

      this.setState({
        range: targetSuperType
      });
      return;
    }

    const currentData = this.state.data.datasets[0].data;

    const currentType = currentData[0].type;
    const currentSuperType = this.indexReference[currentType];

    let targetRangeIndex = currentData[0]["i_" + targetSuperType];
    if (typeof targetRangeIndex === "undefined") {
      targetRangeIndex = currentData[0]["i_" + targetSuperType + "_start"];
    }
    if (
      typeof targetRangeIndex === "undefined" &&
      currentType === targetSuperType
    ) {
      targetRangeIndex = this.database
        .get("lookup")
        .get(targetSuperType)
        .get([currentData[0].interval_start].toString());
    }

    const targetRange = this.database
      .get(targetSuperType)
      .get(targetRangeIndex);

    const lo = targetRange.get("i_" + targetType + "_start");
    const hi = targetRange.get("i_" + targetType + "_end");

    const targetData = this.database
      .get(targetType)
      .slice(lo, hi)
      .toJS();

    this.setChartData(
      targetData,
      targetType,
      this.getChartColors(targetData, targetType, this.colors)
    );

    this.setState({
      range: targetSuperType
    });
  };

  handleEvening = () => {
    const userColors = ["#0000A0", "#add8e6", "#800080"];
    const newData = this.state.data.datasets[0].data.filter(
      item => item.part === 0
    );
    this.setState({
      data: {
        datasets: [
          {
            data: newData,
            backgroundColor: userColors[0],
            barPercentage: 1.1,
            barThickness: "flex"
          }
        ]
      },
      i_intvl: "i_week"
    });
  };

  createDescription = data => {
    const type = data[0].type;
    const superType = this.indexReference[type];

    let startDate;
    let endDate;

    switch (type) {
      case "hour":
        startDate = moment(data[0].interval_start).format(
          "dddd, MMMM Do, YYYY"
        );
        endDate = null;
        break;
      case "part":
        startDate = moment(data[0].interval_start).format("M/D/YYYY");
        startDate = "Week of " + startDate;
        endDate = null;
        break;
      case "day":
        startDate = moment(data[0].interval_start).format("MMMM YYYY");
        endDate = null;
        break;
      case "week":
        startDate = moment(data[0].interval_start).format("YYYY");
        endDate = null;
        break;
      default:
        startDate = moment(data[0].interval_start).format("MMMM Do, YYYY");
        endDate = moment(data[data.length - 1].interval_end).format(
          "MMMM Do, YYYY"
        );
    }

    const intervalSum = this.database
      .get(superType)
      .get(data[0]["i_" + superType])
      .get("sum");

    const now = moment();
    let interval;
    switch (type) {
      case "hour":
        interval = moment(data[0]["interval_start"]).format("dddd");
        break;
      case "part":
        interval =
          "Week of " + moment(data[0]["interval_start"]).format("MMMM Do YYYY");
        break;
      case "day":
        interval = moment(data[0]["interval_start"]).format("MMMM YYYY");
        break;
      case "week":
        interval = moment(data[0]["interval_start"]).format("YYYY");
        break;
      case "month":
        interval = "Complete Energy History";
    }
    return {
      startDate: startDate,
      endDate: endDate,
      interval: interval,
      intervalSum: intervalSum / 1000
    };
  };

  getSum = () => {
    if (!this.state.data.datasets) {
      return;
    }
    const data = this.state.data.datasets[0].data;
    const type = data[0].type;
    const superType = this.indexReference[type];

    return this.database
      .get(superType)
      .get(data[0]["i_" + superType])
      .get("sum");
  };

  getAllTimeAvg = () => {
    if (!this.state.data.datasets) {
      return;
    }

    const data = this.state.data.datasets[0].data;
    const type = data[0].type;
    const superType = this.indexReference[type];

    const sum = this.database
      .get(superType)
      .reduce((acc, x) => acc + x.get("sum"), 0);
    const n = this.database.get(superType).size;

    return sum / n / 1000;
  };

  getYoyChange = () => {
    if (!this.state.data.datasets) {
      return;
    }

    const data = this.state.data.datasets[0].data;
    const type = data[0].type;
    const superType = this.indexReference[type];

    let width;
    switch (superType) {
      case "day":
        width = 14;
        break;
      case "week":
        width = 2;
        break;
      default:
        width = 0;
        break;
    }

    const superData = this.database
      .get(superType)
      .get(data[0]["i_" + superType]);

    const i_superType = data[0]["i_" + superType];

    const season = this.database
      .get(superType)
      .slice(i_superType - width, i_superType + width + 1);
    if (season.get(0) === undefined) return false;

    const curStart = season.get(0).get("interval_start");
    const curEnd = season.get(season.size - 1).get("interval_end");

    const curStartMoment = moment(curStart);
    const curEndMoment = moment(curEnd);

    let yoyStart;
    let yoyEnd;
    switch (superType) {
      case "day":
      case "month":
      case "year":
        yoyStart = moment(curStartMoment)
          .subtract(1, "year")
          .valueOf();
        yoyEnd = moment(curEndMoment)
          .subtract(1, "year")
          .valueOf();
        break;
      case "week":
        yoyStart = moment(curStartMoment)
          .subtract(52, "week")
          .valueOf();
        yoyEnd = moment(curEndMoment)
          .subtract(52, "week")
          .valueOf();
        break;
      default:
        console.error(`superType: ${superType} not found`);
    }

    const i_yoyStart = this.database
      .get("lookup")
      .get(superType)
      .get(yoyStart.toString());

    if (i_yoyStart === undefined) return false;

    const i_yoyEnd = this.database
      .get("lookup")
      .get(superType)
      .get(yoyEnd.toString());

    const prevSeason = this.database.get(superType).slice(i_yoyStart, i_yoyEnd);

    const prevSeasonAvg =
      prevSeason.reduce((acc, x) => acc + x.get("sum"), 0) / prevSeason.size;

    const curSeasonAvg =
      season.reduce((acc, x) => acc + x.get("sum"), 0) / season.size;

    return Math.round((curSeasonAvg / prevSeasonAvg - 1) * 100);
  };

  getSeasonalAvg = () => {
    if (!this.state.data.datasets) {
      return;
    }

    const data = this.state.data.datasets[0].data;
    const type = data[0].type;
    const superType = this.indexReference[type];

    let width;
    switch (superType) {
      case "day":
        width = 14;
        break;
      case "week":
        width = 2;
        break;
      default:
        width = 0;
    }

    const i_superType = this.database
      .get(superType)
      .get(data[0]["i_" + superType]);

    const season = this.database
      .get(superType)
      .slice(i_superType - width, i_superType + width);
  };

  getPieData = () => {
    if (!this.state.data.datasets) {
      return;
    }

    const data = this.state.data.datasets[0].data;
    const type = data[0].type;
    const superType = this.indexReference[type];

    let hi;
    let lo;

    if (type === "month") {
      lo = 0;
      hi = this.database.get("hour").length;
    } else {
      const superData = this.database
        .get(superType)
        .get(data[0]["i_" + superType]);
      lo = superData.get("i_hour_start");
      hi = superData.get("i_hour_end");
    }
    const hourlyData = this.database.get("hour").slice(lo, hi);

    const baselinesGraph = this.state.data.datasets[1].data;
    const baselines = baselinesGraph.slice(0, baselinesGraph.length - 1);

    const partSums = hourlyData.reduce(
      (acc, hour) => {
        acc.splice(
          hour.get("part"),
          1,
          acc[hour.get("part")] + hour.get("sum")
        );
        return acc;
      },
      [0, 0, 0]
    );

    const baselinesTotals = baselines.map(baseline => baseline.y * 24);

    const baselineTotal = baselinesTotals.reduce((acc, x) => x + acc, 0);

    const tempPartLengthArray = [6, 11, 7]; // Backend knows this but it isn't in the database because derp.

    const partSumsAdjusted = partSums.map((partSum, index) =>
      Math.max(partSum - (baselineTotal / 24) * tempPartLengthArray[index], 0)
    );

    const bbb = "t";

    const totalSums = partSumsAdjusted.concat(baselineTotal);

    const averages = totalSums
      .slice(0, totalSums.length - 1)
      .map((x, index) => x / tempPartLengthArray[index]);

    const outputData = () => {
      switch (this.state.partPieView) {
        case "actual":
          return partSums;
        case "baseline":
          return totalSums;
        case "average":
          return averages;
      }
    };

    return {
      datasets: [
        {
          data: outputData(),
          backgroundColor: this.colors,
          label: "Use"
        }
      ],
      labels: ["Night", "Day", "Evening", "Baseline"]
    };
  };

  getPieOptions = () => {
    return {
      maintainAspectRatio: true,
      aspectRatio: 1,
      legend: {
        display: false
      }
    };
  };

  handlePartPieView = e => {
    this.setState({ partPieView: e });
  };

  render() {
    return (
      <div className="energy-history">
        <div className="energy-chart">
          <EnergyChart
            ref="bargraph"
            data={this.state.data}
            options={this.state.options}
            colors={this.colors}
            database={this.database}
          />
          <LowerBar
            range={this.state.range}
            startDate={this.state.description.startDate}
            endDate={this.state.description.endDate}
            onClick={this.handleScroll}
            disableNext={this.state.disableScroll.disableNext}
            disablePrev={this.state.disableScroll.disablePrev}
            onChange={this.handleRangeSelect}
          />
        </div>

        <RightBar
          database={this.database}
          data={this.state.data.datasets}
          sum={this.getSum()}
          avg={this.getAllTimeAvg()}
          carbonMultiplier={this.state.carbonMultiplier}
          yoy={this.getYoyChange()}
          pieData={this.getPieData()}
          pieOptions={this.getPieOptions()}
          defaultValue={this.state.partPieView}
          handlePartPieView={this.handlePartPieView}
          selectedPartPieView={this.state.partPieView}
          range={this.state.range}
        />
      </div>
    );
  }
}
