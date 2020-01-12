import React from "react";
import Trendline from "./Trendline";
import MiniPie from "./MiniPie";
import PartRadio from "./PartRadio";
import PartDropdown from "./PartDropdown";
import ViewTotal from "./ViewTotal";
import CarbonFootprint from "./CarbonFootprint";
import "../../css/App.css";
import SeasonalYoY from "./SeasonalYoY";

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
        {this.props.yoy && <SeasonalYoY yoy={this.props.yoy} />}
        <ViewTotal sum={this.props.sum} avg={this.props.avg} />
        <CarbonFootprint
          sum={this.props.sum}
          carbonMultiplier={this.props.carbonMultiplier}
        />
        <div>
          <div className="kilowatt-hour">
          Time of Use
          </div>
          <MiniPie data={this.props.pieData} options={this.props.pieOptions} />
          <PartDropdown
            handleClick={this.props.handlePartPieView}
            defaultValue={this.props.defaultValue}
            selected={this.props.selectedPartPieView}
          />
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
