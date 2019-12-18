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
        <PageTurner
          onClick={this.props.onClick}
          disabled={this.props.disabled}
        />
        <RightDate endDate={this.props.endDate} />
      </div>
    );
  }
}
