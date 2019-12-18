import React from "react";
import "../../css/App.css";

export default class LeftDate extends React.PureComponent {
  render() {
    return (
      <b className="box">
        <span>{this.props.startDate}</span>
      </b>
    );
  }
}
