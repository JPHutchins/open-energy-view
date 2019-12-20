import React from "react";
import "../../css/App.css";

export default class PageTurner extends React.PureComponent {
  render() {
    return (
      <div className="box">
        <button
          onClick={() => this.props.onClick(-1)}
          className="btn"
          disabled={this.props.disablePrev}
        >
          Previous
        </button>
        <button
          onClick={() => this.props.onClick(1)}
          className="btn"
          disabled={this.props.disableNext}
        >
          Next
        </button>
      </div>
    );
  }
}
