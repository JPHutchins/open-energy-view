import React from "react";
import regression from "regression";
import "../../css/App.css";

export default class Trendline extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  calculateTrend = data => {
    if (!data) return;

    let i = -1;
    const coords = data.map(item => [(i += 1), item.y]);

    return regression.linear(coords).equation[0];
  };

  slopePercentage = slope => {
    if (!slope) return;

    let direction;
    slope <= 0 ? (direction = "- ") : (direction = "+ ");

    return direction + Math.abs(slope) + "%";
  };

  render() {
    return (
      <div className="trendline">
        {this.props.name}
        {this.slopePercentage(
          this.calculateTrend(this.props.data)
        )}
      </div>
    );
  }
}
