import React from "react";
import LeftDate from "./LeftDate";
import RightDate from "./RightDate";
import "../../css/App.css";

export default class LowerBar extends React.PureComponent {
  render() {
    return (
      <div className="container">
        <LeftDate startDate={this.props.startDate} />

        <div className="box">
          <button
            onClick={() => this.props.onClick(-1)}
            className="btn"
            disabled={this.props.disablePrev}
          >
            Previous
          </button>
          <select className="form-control" onChange={this.props.onChange}>
            <option>Day</option>
            <option>Week</option>
            <option>Month</option>
            <option>Year</option>
            <option>Complete</option>
          </select>
          <button
            onClick={() => this.props.onClick(1)}
            className="btn"
            disabled={this.props.disableNext}
          >
            Next
          </button>
        </div>
        <RightDate endDate={this.props.endDate} />
      </div>
    );
  }
}
