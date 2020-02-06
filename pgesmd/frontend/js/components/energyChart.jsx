import React from "react";
import { Bar } from "react-chartjs-2";

export default class EnergyChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div style={{ position: "relative", margin: "auto", width: "1200px"}}>
        <div className="big-chart-title">AVERAGE HOURLY ELECTRICAL USAGE</div>
        <Bar
          ref="bargraph"
          data={this.props.data}
          options={this.props.options}
          height={null}
          width={null}
        />
      </div>
    );
  }
}
