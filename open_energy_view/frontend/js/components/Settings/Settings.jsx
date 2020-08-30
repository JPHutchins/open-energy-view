import React from "react";
import SetPartitions from "./SetPartitions";
import UploadXml from "./UploadXml";
import AuthService from "../../api/AuthService";
import { Button } from "react-bootstrap";
import axios from "axios";
import { useState } from "react";
import { withRouter } from "react-router-dom";

// TODO: add link to account settings ... or just place as child ... could be confusing

const Settings = ({ energyHistory, restrictView, history }) => {
  const [friendlyName, setFriendlyName] = useState(energyHistory.friendlyName);
  const demo = energyHistory.email === "jph@demo.com";

  const handleSaveName = () => {
    const data = {
      friendly_name: energyHistory.friendlyName,
      new_friendly_name: friendlyName,
    };
    axios
      .post("/api/web/change-source-name", data, AuthService.getAuthHeader())
      .then((res) => {
        console.log(res);
      });
  };

  const handleDeleteSource = () => {
    // TODO: small bug here if friendly name has been changed on server but
    // the energyHistory object has not been reloaded

    // TODO: change this alert to modal
    if (
      !window.confirm(
        "Are you sure you want to delete?  All data on the server will be deleted and this action cannot be undone."
      )
    )
      return;
    const key = `${energyHistory.email}${energyHistory.friendlyName}`;
    localStorage.removeItem(key);
    const data = {
      friendly_name: energyHistory.friendlyName,
    };
    axios
      .post("/api/web/delete-source", data, AuthService.getAuthHeader())
      .then(() => {
        restrictView("last", null, false, energyHistory.friendlyName);
        history.push("/");
      });
  };

  return (
    <div className="main-tab-box">
      <h1>{friendlyName} Settings</h1>
      <input
        type="text"
        onChange={(e) => setFriendlyName(e.currentTarget.value)}
      ></input>
      <Button
        disabled={demo}
        onClick={handleSaveName}
        style={{ width: "auto" }}
      >
        Save new name
      </Button>
      <h3>Customize Daily Time Periods</h3>
      <div style={{ marginTop: "90px", padding: "40px 40px 40px 40px" }}>
        <SetPartitions
          existingPartitionOptions={energyHistory.partitionOptions}
          restrictView={restrictView}
        />
      </div>
      <hr />
      <h3>Upload your own ESPI XML data</h3>
      Consider creating a new resource from the "My Data" dropdown and adding
      the new data there. Existing interval data will be overwritten if the
      uploaded data overlaps.
      <UploadXml energyHistory={energyHistory} />
      {/* <h4>Link to account settings</h4> */}
      <hr />
      <Button
        disabled={demo}
        onClick={handleDeleteSource}
        style={{ width: "auto" }}
      >
        Permanently delete this resource and all of its data
      </Button>
    </div>
  );
};
export default withRouter(Settings);
