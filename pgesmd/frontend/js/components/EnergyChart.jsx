import React from "react";
import { Bar } from "react-chartjs-2";
import SourceRegistration from "./SourceRegistration";

/**
 * Container for the primary data display - the "view window".
 */
export default class EnergyChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          padding: "10px",
          position: "relative",
          margin: "auto",
          height: "100%",
          width: "100%"
        }}
      >
        <Bar
          ref="bargraph"
          data={this.props.data}
          options={this.props.options}
        />
      </div>
    );
  }
}
