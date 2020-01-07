import React from "react";
import { Pie } from "react-chartjs-2";

const MiniPie = props => {
  return (
    <div>
      <Pie data={props.data} options={props.options} />
    </div>
  );
};

export default MiniPie;
