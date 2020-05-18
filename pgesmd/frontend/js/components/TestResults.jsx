import React from "react";
import { testPerformance } from "../Types.js"

const TestResults = props => {
    testPerformance();

    return (
      <div>
        Check the console.
      </div>
    );
  };
  
  export default TestResults;
  