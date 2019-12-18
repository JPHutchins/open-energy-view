import React from "react";
import "../../css/App.css";

export default class PageTurner extends React.PureComponent {
  render() {
    return (
      <div className="box">
        <button
          onClick={() => this.props.onClick("previous")}
          className="btn"
          disabled={this.props.disabled}
        >
          Previous
        </button>
        <button
          onClick={() => this.props.onClick("next")}
          className="btn"
          disabled={this.props.disabled}
        >
          Next
        </button>
      </div>
    );
  }
}
