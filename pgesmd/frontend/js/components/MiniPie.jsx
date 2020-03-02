import React from "react";
import { Pie } from "react-chartjs-2";

/**
 * Return a flexibly sized ChartJS pie chart.
 *
 * @param {Object} props React props.
 * @param {Object} props.data The ChartJS data object.
 * @param {Object} props.options The ChartJS options object.
 */
const MiniPie = props => {
  return (
    <Pie data={props.data} options={props.options} height={null} width={null} />
  );
};

export default MiniPie;
