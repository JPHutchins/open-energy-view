import React from "react";
import LeftDate from "./LeftDate";
import RightDate from "./RightDate";
import "../../css/App.css";
import { DropdownButton, Dropdown} from "react-bootstrap"

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
          <DropdownButton title={this.props.range} onSelect={this.props.onChange}>
            <Dropdown.Item eventKey="Day">Day</Dropdown.Item>
            <Dropdown.Item eventKey="Week">Week</Dropdown.Item>
            <Dropdown.Item eventKey="Month">Month</Dropdown.Item>
            <Dropdown.Item eventKey="Year">Year</Dropdown.Item>
            <Dropdown.Item eventKey="Complete">Complete</Dropdown.Item>
          </DropdownButton>
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
