import React from "react";
import { Pie } from "react-chartjs-2";

const MiniPie = props => {
  return (
    <Pie data={props.data} options={props.options} height={null} width={null} />
  );
};

export default MiniPie;
