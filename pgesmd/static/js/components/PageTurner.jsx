import React from "react";
import "../../css/App.css";

export default class PageTurner extends React.PureComponent {
  render() {
    return (
      <div className="box">
        <button onClick={() => this.props.onClick("previous")} className="btn">
          Previous
        </button>
        <button onClick={() => this.props.onClick("next")} className="btn">
          Next
        </button>
      </div>
    );
  }
}
