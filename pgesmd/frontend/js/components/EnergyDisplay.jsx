import React, { useState } from "react";
import EnergyChart from "./EnergyChart";
import moment from "moment";
import { EnergyHistory } from "../data-structures/EnergyHistory";
import {
  curry,
  compose,
  addIndex,
  map,
  chain,
  join,
  chian,
  ap,
  indexOf,
  lift,
  either,
  sum,
  isNil,
  slice,
  mean,
  range,
  isEmpty,
  prepend,
  reduce,
  drop,
  head,
  pipe,
  zip,
  zipObj,
  zipWith,
  __,
} from "ramda";
import { Maybe, IO, Either, Identity } from "ramda-fantasy";
import { startOfDay, endOfDay } from "date-fns";

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
