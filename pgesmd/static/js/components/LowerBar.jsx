import React from "react";
import LeftDate from "./LeftDate";
import RightDate from "./RightDate";
import PageTurner from "./PageTurner";
import "../../css/App.css";

export default class LowerBar extends React.PureComponent {
  render() {
    return (
      <div className="container">
        <LeftDate startDate={this.props.startDate} />
        <select
          style={{ width: "auto" }}
          className="form-control"
          onChange={this.props.onChange}
        >
          <option>Day</option>
          <option>Week</option>
          <option>Month</option>
          <option>Year</option>
          <option>Complete</option>
        </select>
        <PageTurner
          onClick={this.props.onClick}
          disableNext={this.props.disableNext}
          disablePrev={this.props.disablePrev}
        />
        <RightDate endDate={this.props.endDate} />
      </div>
    );
  }
}
