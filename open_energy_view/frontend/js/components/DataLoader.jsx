import React from "react";
import { mdiGamepadCircleOutline } from "@mdi/js";
import Icon from "@mdi/react";

const DataLoader = (props) => {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px",
        position: "relative",
        margin: "auto",
        width: "80vw",
        height: "80vh",
      }}
    >
      <div className="data-loader">
        <Icon
          className="sidebar-icon rotate"
          color="#5f5566"
          path={mdiGamepadCircleOutline}
        />
      </div>
    </div>
  );
};

export default DataLoader;
