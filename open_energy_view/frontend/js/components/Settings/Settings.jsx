import React from "react";
import SetPartitions from "./SetPartitions";
import UploadXml from "./UploadXml";
import AuthService from "../../api/AuthService"
import { Button } from "react-bootstrap"
import axios from "axios"
import { useState } from "react";

// TODO: add link to account settings ... or just place as child ... could be confusing

const Settings = ({ energyHistory, restrictView }) => {
  const [friendlyName, setFriendlyName] = useState(energyHistory.friendlyName)

  const handleSaveName = () => {
    const data = {
      friendly_name: energyHistory.friendlyName,
      new_friendly_name: friendlyName
    };
    axios.post("/api/web/change-source-name", data, AuthService.getAuthHeader())
      .then((res) => {
        console.log(res)
      })
  }

  const handleDeleteSource = () => {
    // TODO: small bug here if friendly name has been changed on server but
    // the energyHistory object has not been reloaded
    const data = {
      friendly_name: energyHistory.friendlyName
    };
    axios.post("/api/web/delete-source", data, AuthService.getAuthHeader())
      .then((res) => {
        console.log(res)
      })
      .then(() => {
        history.push("/")
      })
  }

  return (
    <div className="main-tab-box">
      <h1>{friendlyName} Settings</h1>
      <input type="text" onChange={e=> setFriendlyName(e.currentTarget.value)}></input>
      <Button onClick={handleSaveName} style={{width: "auto"}}>Save new name</Button>
      <h3>Customize Daily Time Periods</h3>
      <div style={{ marginTop: "90px", padding: "40px 40px 40px 40px" }}>
        <SetPartitions
          existingPartitionOptions={energyHistory.partitionOptions}
          restrictView={restrictView}
        />
      </div>
      <hr />
      <h3>Upload your own ESPI XML data</h3>
      Consider creating a new resource from the "My Data" dropdown and adding the new data there.
      Existing interval data will be overwritten if the uploaded data overlaps.
      <UploadXml energyHistory={energyHistory} />
      {/* <h4>Link to account settings</h4> */}
      <hr />
      <Button onClick={handleDeleteSource} style={{width: "auto"}}>Permanently delete this resource and all of it's data</Button>
    </div>
  );
};
export default Settings;
