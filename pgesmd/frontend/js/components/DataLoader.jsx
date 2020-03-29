import React from "react";
import Loader from "react-loader-spinner";

const DataLoader = props => {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px",
        position: "relative",
        margin: "auto",
        width: "80vw",
        height: "80vh"
      }}
    >
      <div className="data-loader">
        Loading data...
        <Loader type="Bars" color="purple" height={100} width={100} />
      </div>
    </div>
  );
};

export default DataLoader;
