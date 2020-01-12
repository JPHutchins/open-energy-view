import React from "react";
import "../../css/App.css";

export default class RightDate extends React.PureComponent {
  render() {
    return (
      <b className="box">
        <span>{this.props.endDate}</span>
      </b>
    );
  }
}
