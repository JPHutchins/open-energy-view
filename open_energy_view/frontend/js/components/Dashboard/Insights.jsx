import React from "react";

const Insights = ({ mostIntensePart, mostUsedPart, trendingDescription }) => {
  return (
    <div className="insights dev-border">
      <ul>
        <li>
          Energy is used most intensely during the{" "}
          <strong>{` ${mostIntensePart.toLowerCase()}`}</strong>
        </li>
        <li>
          <strong>{mostUsedPart}</strong> use accounts for the most energy
          overall
        </li>
        <li>
          Energy use is trending{" "}
          <strong>{trendingDescription.upDownFlat}</strong> year over year
        </li>
      </ul>
    </div>
  );
};
export default Insights;
