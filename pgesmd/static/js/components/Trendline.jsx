import React from "react";
import regression from "regression";
import "../../css/App.css";

export default class Trendline extends React.PureComponent {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  calculateTrend = data => {
    if (!data) return;

    let i = -1;
    const coords = data.map(item => [(i += 1), item.y]);

    return regression.linear(coords).equation[0];
  };

  draw = (ctx, slope) => {
    const width = this.canvasRef.current.width;
    const height = this.canvasRef.current.height;

    const lineSlope = slope => {
      if (slope <= 0) {
        return Math.max(slope * 10, -height / 2);
      }
      return Math.min(slope * 10, height / 2);
    };

    const lineColor = slope => {
      if (slope <= 0) {
        return "#00cc00";
      }
      return "#ff8000";
    };

    const slopePercentage = (slope, data) => {
      let direction;
      slope <= 0 ? (direction = "- ") : (direction = "+ ");

      return direction + Math.abs(slope) + "%";
    };

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(-15, height / 2);
    ctx.lineTo(width + 15, height / 2 - lineSlope(slope));
    ctx.strokeStyle = lineColor(slope);
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.font = "30px Arial";
    ctx.fillText(slopePercentage(slope), 0, height / 2);
  };

  componentDidMount() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    this.draw(ctx, this.calculateTrend(this.props.data));
  }

  componentDidUpdate() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    this.draw(ctx, this.calculateTrend(this.props.data));
  }

  render() {
    return (
      <div className="trendline">
        {this.props.name}
        <canvas ref={this.canvasRef} width="120" height="120"></canvas>
      </div>
    );
  }
}
