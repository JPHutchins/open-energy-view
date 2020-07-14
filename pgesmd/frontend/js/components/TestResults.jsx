import React from "react";

const TestResults = (props) => {
  Promise.allSettled([fetchHours("PG&E")]).then((p) => {
    p = p.map((res) => res.value);
    testPerformance({ database: p[0] });
  });

  return <div>Check the console.</div>;
};

export default TestResults;
