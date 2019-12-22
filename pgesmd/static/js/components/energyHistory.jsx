import React from "react";
import moment from "moment";
import EnergyChart from "./energyChart";
import { getCompleteData, makeOptions } from "../utils.js";
import "../../css/App.css";
import LowerBar from "./LowerBar";

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
      }
    };
    this.indexReference = {
      hour: "day",
      part: "week",
      day: "month",
      week: "year",
      month: "year",
      year: "all"
    };
    this.zoom = ["hour", "part", "day", "week", "month", "year"];
    this.chartSettings = {
      barPercentage: 1.0,
      barThickness: "flex"
    };
    this.database = {};
  }

  componentDidMount = () => {
    getCompleteData()
      .then(data => {
        this.database = fromJS(data);
        console.log(this.database.toJS());
      })
      .then(() => {
        this.setMostRecent("part");
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
    return "#0000A0";
  };

  barClickEvent = index => {
    console.log(index);
    const zoom = {
      part: "hour"
    };

    // const currentData = this.state.data.datasets[0].data;
    // const database = this.database;
    // const currentType = currentData.type;

    // this.getSlicePoints();
  };

  setChartData = (data, type, color) => {
    if (type === "part" && data.length < 21) {
      data.push(data[data.length - 1]);
      data[data.length - 1].x = moment(data[0].x)
        .add(1, "week")
        .valueOf();
      data[data.length - 1].y = 0;
    }
    this.setState({
      data: {
        datasets: [
          {
            data: data,
            backgroundColor: color,
            barPercentage: this.chartSettings.barPercentage,
            barThickness: this.chartSettings.barThickness
          }
        ]
      },
      options: makeOptions(type, this.barClickEvent),
      description: this.createDescription(data),
      disableScroll: this.checkDisableScroll(data, type, this.database)
    });
  };

  handleZoomOut = () => {
    const currentData = this.state.data.datasets[0].data;
    const currentType = currentData[0].type;
    const type = this.zoom[this.zoom.indexOf(currentType) + 1];

    const superType = this.indexReference[type];

    const dataPoints = this.database.get(type);

    let dataRange;
    let newData;

    if (type === "month") {
      dataRange = this.database.get("month");
      newData = dataPoints;
    } else {
      dataRange = this.database.get(superType);
      const lo = dataRange
        .get(currentData[0]["i_" + superType])
        .get("i_" + type + "_start");
      const hi = dataRange
        .get(currentData[0]["i_" + superType])
        .get("i_" + type + "_end");

      newData = dataPoints.slice(lo, hi);
    }

    this.setState({
      data: {
        datasets: [
          {
            data: newData.toJS(),
            backgroundColor: "#0000A0",
            barPercentage: this.chartSettings.barPercentage,
            barThickness: this.chartSettings.barThickness
          }
        ]
      },
      options: makeOptions(type, this.barClickEvent),
      description: this.createDescription(newData.toJS())
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

  createDescription = currentData => {
    const startDate = moment(currentData[0].interval_start).format(
      "MMMM Do, YYYY"
    );
    const endDate = moment(
      currentData[currentData.length - 1].interval_end
    ).format("MMMM Do, YYYY");
    return {
      startDate: startDate,
      endDate: endDate
    };
  };

  render() {
    return (
      <div>
        <EnergyChart
          data={this.state.data}
          options={this.state.options}
          colors={this.colors}
          database={this.database}
        />
        <LowerBar
          startDate={this.state.description.startDate}
          endDate={this.state.description.endDate}
          onClick={this.handleScroll}
          disableNext={this.state.disableScroll.disableNext}
          disablePrev={this.state.disableScroll.disablePrev}
        />
        <button onClick={this.handleZoomOut} className="btn">
          Zoom Out
        </button>
      </div>
    );
  }
}
