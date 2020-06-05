import React, { useState } from "react";
import EnergyChart from "./EnergyChart";

const EnergyDisplay = (props) => {
  const [test, setTest] = useState(props.tester);

  return (
    <div style={{ height: "80%" }}>
      <EnergyChart data={test.data} options={test.chartOptions} />
      <button onClick={() => setTest(test.prev())}>Previous</button>
      <button onClick={() => setTest(test.next())}>Next</button>
      <button onClick={() => setTest(test.setWindow("day"))}>Day</button>
      <button onClick={() => setTest(test.setWindow("week"))}>Week</button>
      <button onClick={() => setTest(test.setWindow("month"))}>Month</button>
      <button onClick={() => setTest(test.setWindow("year"))}>Year</button>
      <button onClick={() => setTest(test.setWindow("total"))}>total</button>
    </div>
  );
};
export default EnergyDisplay;
