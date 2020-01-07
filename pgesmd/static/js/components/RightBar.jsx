import React from "react";
import Trendline from "./Trendline";
import MiniPie from "./MiniPie";
import "../../css/App.css";

export default class RightBar extends React.PureComponent {
  getData = (datasets, index) => {
    if (!datasets) return undefined;
    return datasets[index].data;
  };

  adjustForBaseline = () => {
    const data = this.getData(this.props.data, 0);
    if (!data) return undefined;

    const dataB = this.getData(this.props.data, 1);
    if (!dataB) return undefined;

    let output = [];

    for (let i = 0; i < data.length; i++) {
      output.push({
        x: data[i].x,
        y: data[i].y - data[i].baseline
      });
    }

    return output;
  };

  render() {
    return (
      <div className="right-bar">
        <div>
          Total: {Math.round(this.props.sum / 1000)}kWh{"\n"}
          {Math.round((this.props.sum / 1000 / this.props.avg - 1) * 100)}%
        </div>
        <div>Seasonal YoY: {this.props.yoy}</div>
        <div>
          <MiniPie data={this.props.pieData} options={this.props.pieOptions} />
        </div>
        <div>
          <Trendline
            data={this.getData(this.props.data, 0)}
            name="Overall Trend "
          />
        </div>
        <div>
          <Trendline
            data={this.getData(this.props.data, 1)}
            name="Baseline Trend "
          />
        </div>
      </div>
    );
  }
}
