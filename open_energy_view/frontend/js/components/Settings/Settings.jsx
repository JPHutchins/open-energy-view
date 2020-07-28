import React from "react";
import SetPartitions from "./SetPartitions";

// TODO: add link to account settings ... or just place as child ... could be confusing

const Settings = ({ energyHistory, restrictView }) => {
  return (
    <div className="main-tab-box">
      <h1>{energyHistory.friendlyName} Settings</h1>
      <h3>Customize Daily Time Periods</h3>
      <div style={{ marginTop: "90px", padding: "40px 40px 40px 40px" }}>
        <SetPartitions
          existingPartitionOptions={energyHistory.partitionOptions}
          restrictView={restrictView}
        />
      </div>
      {/* <h4>Link to account settings</h4> */}
    </div>
  );
};
export default Settings;
